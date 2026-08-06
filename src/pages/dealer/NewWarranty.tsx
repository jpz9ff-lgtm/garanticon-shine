import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, FileText, Loader2, Lock, Save, ShieldCheck } from "lucide-react";
import { addMonths, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DealerHeader } from "@/components/dealer/DealerHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import {
  compradorSchema,
  vehiculoSchema,
  garantiaSchema,
  calcularGarantia,
  limiteAveriaFor,
  type Modalidad,
} from "@/lib/garanticon-validators";
import { WarrantyTierIndicator } from "@/components/dealer/WarrantyTierIndicator";

type FormState = {
  // comprador
  comprador_nombre: string; comprador_dni: string; comprador_telefono: string;
  comprador_email: string; comprador_direccion: string; comprador_cp: string;
  comprador_poblacion: string; comprador_provincia: string;
  // vehiculo
  vehiculo_marca: string; vehiculo_modelo: string; matricula: string;
  bastidor: string; fecha_matriculacion: string; km_venta: string;
  precio_venta: string; combustible: "Gasolina" | "Diésel" | "Híbrido" | "Eléctrico";
  tipo_cambio: "Manual" | "Automático"; traccion_4x4: boolean;
  // electrico
  es_electrico: boolean;
  // garantia
  modalidad: Modalidad; fecha_venta: string; fecha_inicio: string; fecha_fin: string;
  acepta_condiciones: boolean;
};

const empty: FormState = {
  comprador_nombre: "", comprador_dni: "", comprador_telefono: "", comprador_email: "",
  comprador_direccion: "", comprador_cp: "", comprador_poblacion: "", comprador_provincia: "",
  vehiculo_marca: "", vehiculo_modelo: "", matricula: "", bastidor: "",
  fecha_matriculacion: "", km_venta: "", precio_venta: "",
  combustible: "Gasolina", tipo_cambio: "Manual", traccion_4x4: false,
  es_electrico: false,
  modalidad: "ESENCIAL",
  fecha_venta: format(new Date(), "yyyy-MM-dd"),
  fecha_inicio: format(new Date(), "yyyy-MM-dd"),
  fecha_fin: format(addMonths(new Date(), 12), "yyyy-MM-dd"),
  acepta_condiciones: false,
};

const NewWarranty = () => {
  const { dealer } = useAuth();
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEdit = Boolean(editId);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEdit);
  const [originalMatricula, setOriginalMatricula] = useState<string>("");

  useEffect(() => {
    if (!isEdit || !editId) return;
    setLoadingEdit(true);
    supabase
      .from("warranties")
      .select("*")
      .eq("id", editId)
      .maybeSingle()
      .then(({ data: w, error }) => {
        if (error || !w) {
          toast({ variant: "destructive", title: "Error", description: error?.message ?? "Garantía no encontrada" });
          setLoadingEdit(false);
          return;
        }
        setData({
          comprador_nombre: w.comprador_nombre ?? "",
          comprador_dni: w.comprador_dni ?? "",
          comprador_telefono: w.comprador_telefono ?? "",
          comprador_email: w.comprador_email ?? "",
          comprador_direccion: w.comprador_direccion ?? "",
          comprador_cp: w.comprador_cp ?? "",
          comprador_poblacion: w.comprador_poblacion ?? "",
          comprador_provincia: w.comprador_provincia ?? "",
          vehiculo_marca: w.vehiculo_marca ?? "",
          vehiculo_modelo: w.vehiculo_modelo ?? "",
          matricula: w.matricula ?? "",
          bastidor: w.bastidor ?? "",
          fecha_matriculacion: w.fecha_matriculacion ?? "",
          km_venta: w.km_venta?.toString() ?? "",
          precio_venta: w.precio_venta?.toString() ?? "",
          combustible: (w.combustible as FormState["combustible"]) ?? "Gasolina",
          tipo_cambio: (w.tipo_cambio as FormState["tipo_cambio"]) ?? "Manual",
          traccion_4x4: Boolean(w.traccion_4x4),
          es_electrico: Boolean(w.es_electrico),
          modalidad: w.modalidad as Modalidad,
          fecha_venta: w.fecha_venta ?? "",
          fecha_inicio: w.fecha_inicio ?? "",
          fecha_fin: w.fecha_fin ?? "",
          acepta_condiciones: true,
        });
        setOriginalMatricula(w.matricula ?? "");
        setLoadingEdit(false);
      });
  }, [editId, isEdit]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setData((d) => {
      const next = { ...d, [k]: v };
      // Cuando cambia fecha_inicio, recalcula fecha_fin (+12 meses)
      if (k === "fecha_inicio" && typeof v === "string" && v) {
        next.fecha_fin = format(addMonths(new Date(v), 12), "yyyy-MM-dd");
      }
      // Combustible "Eléctrico" activa automáticamente el contrato específico BEV
      if (k === "combustible") {
        if (v === "Eléctrico") next.es_electrico = true;
        else if (d.combustible === "Eléctrico") next.es_electrico = false;
      }
      return next;
    });
  };

  // Modalidad detectada automáticamente en tiempo real
  const detectedTier = useMemo(
    () => calcularGarantia(data.fecha_matriculacion, data.km_venta === "" ? null : Number(data.km_venta)),
    [data.fecha_matriculacion, data.km_venta],
  );

  // Sincroniza modalidad automáticamente y notifica cambios de tipo
  const lastTierRef = useRef<string | null>(null);
  useEffect(() => {
    if (!detectedTier) return;
    if (data.modalidad !== detectedTier.tipo) {
      setData((d) => ({ ...d, modalidad: detectedTier.tipo }));
    }
    if (lastTierRef.current && lastTierRef.current !== detectedTier.tipo) {
      toast({ title: "✔ Garantía actualizada", description: `Ahora es ${detectedTier.nombre}` });
    }
    lastTierRef.current = detectedTier.tipo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedTier?.tipo]);

  const normalizeMatricula = (m: string) =>
    m.trim().toUpperCase().replace(/\s|-/g, "");

  const isMatriculaDuplicada = async (matricula: string) => {
    let query = supabase
      .from("warranties")
      .select("id, numero_poliza")
      .eq("matricula", matricula);
    if (isEdit && editId) query = query.neq("id", editId);
    const { data: existing, error } = await query.maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    return existing;
  };

  const validateStep = (s: number) => {
    let result;
    if (s === 1) result = compradorSchema.safeParse(data);
    else if (s === 2) result = vehiculoSchema.safeParse(data);
    else result = garantiaSchema.safeParse(data);

    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => { errs[i.path.join(".")] = i.message; });
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const next = async () => {
    if (!validateStep(step)) return;
    if (step === 2) {
      try {
        const matricula = normalizeMatricula(data.matricula);
        const skipCheck = isEdit && matricula === normalizeMatricula(originalMatricula);
        const existing = skipCheck ? null : await isMatriculaDuplicada(matricula);
        if (existing) {
          setErrors((e) => ({ ...e, matricula: "Esta matrícula ya tiene una garantía registrada." }));
          toast({
            variant: "destructive",
            title: "Matrícula duplicada",
            description: `Ya existe una garantía (${existing.numero_poliza}) para esta matrícula.`,
          });
          return;
        }
      } catch (e: any) {
        toast({ variant: "destructive", title: "Error", description: e?.message ?? "No se pudo verificar la matrícula" });
        return;
      }
    }
    setStep((s) => s + 1);
  };
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const submit = async () => {
    if (!validateStep(3)) return;
    if (!dealer) return;

    if (!detectedTier) {
      toast({ variant: "destructive", title: "Faltan datos",
        description: "Rellena la fecha de matriculación y los kilómetros para detectar la garantía." });
      setStep(2);
      return;
    }
    if (!data.acepta_condiciones) {
      toast({ variant: "destructive", title: "Aceptación obligatoria",
        description: "Debes confirmar que aceptas los límites económicos de la garantía." });
      setStep(3);
      return;
    }

    setSubmitting(true);
    try {
      const matriculaNorm = normalizeMatricula(data.matricula);
      const skipCheck = isEdit && matriculaNorm === normalizeMatricula(originalMatricula);
      const duplicada = skipCheck ? null : await isMatriculaDuplicada(matriculaNorm);
      if (duplicada) {
        toast({
          variant: "destructive",
          title: "Matrícula duplicada",
          description: `Ya existe una garantía (${duplicada.numero_poliza}) para esta matrícula.`,
        });
        setStep(2);
        setErrors((e) => ({ ...e, matricula: "Esta matrícula ya tiene una garantía registrada." }));
        setSubmitting(false);
        return;
      }

      const payload = {
          comprador_nombre: data.comprador_nombre.trim(),
          comprador_dni: data.comprador_dni.trim().toUpperCase(),
          comprador_telefono: data.comprador_telefono.trim(),
          comprador_email: data.comprador_email.trim() || null,
          comprador_direccion: data.comprador_direccion.trim(),
          comprador_cp: data.comprador_cp.trim(),
          comprador_poblacion: data.comprador_poblacion.trim(),
          comprador_provincia: data.comprador_provincia.trim(),
          vehiculo_marca: data.vehiculo_marca.trim(),
          vehiculo_modelo: data.vehiculo_modelo.trim(),
          matricula: matriculaNorm,
          bastidor: data.bastidor.trim() || null,
          fecha_matriculacion: data.fecha_matriculacion,
          km_venta: Number(data.km_venta),
          precio_venta: Number(data.precio_venta),
          combustible: data.combustible,
          tipo_cambio: data.tipo_cambio,
          traccion_4x4: data.traccion_4x4,
          es_electrico: data.es_electrico,
          modalidad: detectedTier.tipo,
          limite_averia: detectedTier.cobertura,
          fecha_venta: data.fecha_venta,
          fecha_inicio: data.fecha_inicio,
          fecha_fin: data.fecha_fin,
      };

      if (isEdit && editId) {
        const { error } = await supabase.from("warranties").update(payload).eq("id", editId);
        if (error) throw error;
        toast({ title: "Garantía actualizada", description: "Los cambios se han guardado." });
        navigate(`/dealer/garantia/${editId}`);
      } else {
        const { data: polizaResp, error: polizaErr } = await supabase.rpc("generate_poliza_number");
        if (polizaErr || !polizaResp) throw polizaErr ?? new Error("No se pudo generar número");
        const { data: inserted, error } = await supabase
          .from("warranties")
          .insert({
            ...payload,
            numero_poliza: polizaResp as unknown as string,
            dealer_id: dealer.id,
          })
          .select("id")
          .single();
        if (error) throw error;
        toast({ title: "Garantía emitida", description: `Nº póliza ${polizaResp}` });
        navigate(`/dealer/garantia/${inserted.id}`);
      }
    } catch (e: any) {
      const msg = e?.code === "23505" || /duplicate key/i.test(e?.message ?? "")
        ? "Esta matrícula ya tiene una garantía registrada."
        : e?.message ?? "Inténtalo de nuevo";
      toast({ variant: "destructive", title: isEdit ? "Error al actualizar" : "Error al emitir", description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const errMsg = (k: string) => errors[k] && <p className="text-xs font-medium text-destructive">{errors[k]}</p>;

  return (
    <div className="min-h-screen bg-muted/20">
      <DealerHeader />
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{isEdit ? "Editar Garantía" : "Nueva Garantía"}</h1>
            <p className="text-muted-foreground">Paso {step} de 3</p>
          </div>
          <Button variant="outline" onClick={() => navigate(isEdit && editId ? `/dealer/garantia/${editId}` : "/dealer/dashboard")}>
            <ArrowLeft className="mr-1" /> Volver
          </Button>
        </div>

        <Progress value={(step / 3) * 100} className="h-2 [&>div]:bg-primary" />

        {loadingEdit && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 animate-spin" /> Cargando garantía…
          </div>
        )}
        {!loadingEdit && (<>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>1. Datos del Comprador</CardTitle>
              <CardDescription>Persona o empresa titular de la garantía.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 space-y-1.5">
                <Label>Nombre y apellidos / Razón social *</Label>
                <Input value={data.comprador_nombre} onChange={(e) => update("comprador_nombre", e.target.value)} />
                {errMsg("comprador_nombre")}
              </div>
              <div className="space-y-1.5">
                <Label>DNI / NIE / CIF *</Label>
                <Input value={data.comprador_dni} onChange={(e) => update("comprador_dni", e.target.value.toUpperCase())} />
                {errMsg("comprador_dni")}
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono *</Label>
                <Input value={data.comprador_telefono} onChange={(e) => update("comprador_telefono", e.target.value)} />
                {errMsg("comprador_telefono")}
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" value={data.comprador_email} onChange={(e) => update("comprador_email", e.target.value)} />
                {errMsg("comprador_email")}
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label>Dirección *</Label>
                <Input value={data.comprador_direccion} onChange={(e) => update("comprador_direccion", e.target.value)} />
                {errMsg("comprador_direccion")}
              </div>
              <div className="space-y-1.5">
                <Label>Código postal *</Label>
                <Input maxLength={5} value={data.comprador_cp} onChange={(e) => update("comprador_cp", e.target.value)} />
                {errMsg("comprador_cp")}
              </div>
              <div className="space-y-1.5">
                <Label>Población *</Label>
                <Input value={data.comprador_poblacion} onChange={(e) => update("comprador_poblacion", e.target.value)} />
                {errMsg("comprador_poblacion")}
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label>Provincia *</Label>
                <Input value={data.comprador_provincia} onChange={(e) => update("comprador_provincia", e.target.value)} />
                {errMsg("comprador_provincia")}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>2. Datos del Vehículo</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Marca *</Label>
                <Input value={data.vehiculo_marca} onChange={(e) => update("vehiculo_marca", e.target.value)} />
                {errMsg("vehiculo_marca")}
              </div>
              <div className="space-y-1.5">
                <Label>Modelo *</Label>
                <Input value={data.vehiculo_modelo} onChange={(e) => update("vehiculo_modelo", e.target.value)} />
                {errMsg("vehiculo_modelo")}
              </div>
              <div className="space-y-1.5">
                <Label>Matrícula *</Label>
                <Input
                  value={data.matricula}
                  onChange={(e) => update("matricula", e.target.value.toUpperCase())}
                  placeholder="1234ABC"
                />
                {errMsg("matricula")}
              </div>
              <div className="space-y-1.5">
                <Label>Nº Bastidor (VIN) *</Label>
                <Input
                  maxLength={17}
                  value={data.bastidor}
                  onChange={(e) => update("bastidor", e.target.value.toUpperCase())}
                  placeholder="17 caracteres"
                />
                {errMsg("bastidor")}
              </div>
              <div className="space-y-1.5">
                <Label>Fecha 1ª matriculación *</Label>
                <Input type="date" value={data.fecha_matriculacion} onChange={(e) => update("fecha_matriculacion", e.target.value)} />
                {errMsg("fecha_matriculacion")}
              </div>
              <div className="space-y-1.5">
                <Label>Km en venta *</Label>
                <Input type="number" min="0" value={data.km_venta} onChange={(e) => update("km_venta", e.target.value)} />
                {errMsg("km_venta")}
              </div>
              <div className="space-y-1.5">
                <Label>Precio de venta (€) *</Label>
                <Input type="number" min="0" step="0.01" value={data.precio_venta} onChange={(e) => update("precio_venta", e.target.value)} />
                {errMsg("precio_venta")}
              </div>
              <div className="md:col-span-2">
                <WarrantyTierIndicator
                  fechaMatriculacion={data.fecha_matriculacion}
                  kmVenta={data.km_venta}
                />
              </div>
              <div className="space-y-2">
                <Label>Combustible *</Label>
                <RadioGroup value={data.combustible} onValueChange={(v) => update("combustible", v as FormState["combustible"])} className="flex flex-wrap gap-3">
                  {(["Gasolina", "Diésel", "Híbrido", "Eléctrico"] as const).map((c) => (
                    <label key={c} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <RadioGroupItem value={c} /> {c}
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Cambio *</Label>
                <RadioGroup value={data.tipo_cambio} onValueChange={(v) => update("tipo_cambio", v as FormState["tipo_cambio"])} className="flex flex-wrap gap-3">
                  {(["Manual", "Automático"] as const).map((c) => (
                    <label key={c} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <RadioGroupItem value={c} /> {c}
                    </label>
                  ))}
                </RadioGroup>
              </div>
              {data.combustible === "Eléctrico" && (
                <div className="md:col-span-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                  ⚡ Vehículo 100% eléctrico detectado. Se emitirá el contrato específico para vehículos eléctricos.
                </div>
              )}
              <div className="md:col-span-2 flex items-start gap-2">
                <Checkbox
                  id="bev"
                  checked={data.es_electrico}
                  onCheckedChange={(v) => update("es_electrico", Boolean(v))}
                  className="mt-0.5"
                />
                <Label htmlFor="bev" className="cursor-pointer font-normal">
                  Vehículo 100% eléctrico (BEV) — genera el contrato específico para eléctricos
                </Label>
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <Checkbox id="4x4" checked={data.traccion_4x4} onCheckedChange={(v) => update("traccion_4x4", Boolean(v))} />
                <Label htmlFor="4x4" className="cursor-pointer">Tracción 4x4</Label>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>3. Garantía y vigencia</CardTitle>
              <CardDescription>La modalidad se asigna automáticamente según el vehículo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <WarrantyTierIndicator
                fechaMatriculacion={data.fecha_matriculacion}
                kmVenta={data.km_venta}
              />

              {/* Tipo de garantía bloqueado */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  Tipo de garantía
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Asignado automáticamente según datos del vehículo</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  value={detectedTier ? detectedTier.nombre : ""}
                  readOnly
                  disabled
                  placeholder="Rellena año y km en el paso anterior"
                  className="cursor-not-allowed bg-muted font-semibold"
                />
              </div>

              {/* Condiciones colapsables */}
              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-muted/30 p-3 text-sm font-medium hover:bg-muted/60">
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Ver condiciones del tramo</span>
                  <span className="text-xs text-muted-foreground">desplegar</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 rounded-b-lg border border-t-0 bg-background p-4 text-sm text-muted-foreground">
                  <p>• <strong>Cobertura máxima por avería:</strong> {detectedTier ? `${detectedTier.cobertura.toLocaleString("es-ES")} €` : "—"} IVA inc.</p>
                  <p>• <strong>Límite total acumulado durante la vigencia:</strong> el valor de tasación del vehículo ({data.precio_venta ? `${Number(data.precio_venta).toLocaleString("es-ES")} €` : "—"}).</p>
                  <p>• <strong>Averías independientes:</strong> averías sin relación técnica entre sí se consideran eventos independientes, cada uno con su propio límite de cobertura.</p>
                </CollapsibleContent>
              </Collapsible>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Fecha de venta *</Label>
                  <Input type="date" value={data.fecha_venta} onChange={(e) => update("fecha_venta", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Inicio de cobertura *</Label>
                  <Input type="date" value={data.fecha_inicio} onChange={(e) => update("fecha_inicio", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fin de cobertura *</Label>
                  <Input type="date" value={data.fecha_fin} onChange={(e) => update("fecha_fin", e.target.value)} />
                </div>
              </div>

              {/* Aceptación de límites — obligatoria */}
              <div className="rounded-lg border-l-4 border-blue-700 bg-[#F0F7FF] p-4">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-700" />
                  <div className="space-y-3 text-sm text-slate-800">
                    <p>
                      He leído y comprendo que la garantía GARANTICON{" "}
                      <strong>{detectedTier?.nombre ?? "—"}</strong> cubre hasta{" "}
                      <strong>{detectedTier ? `${detectedTier.cobertura.toLocaleString("es-ES")} €` : "—"}</strong>{" "}
                      por avería. El total máximo abonado durante la vigencia del contrato no superará el valor de
                      tasación del vehículo en el momento de la contratación{" "}
                      (<strong>{data.precio_venta ? `${Number(data.precio_venta).toLocaleString("es-ES")} €` : "—"}</strong>).
                    </p>
                    <p>
                      Entiendo que averías sin relación técnica entre sí se consideran eventos independientes, cada uno
                      con su propio límite de cobertura.
                    </p>
                    <p>
                      Entiendo que Garanticon no está obligado a abonar cantidades que superen los límites descritos,
                      aunque el coste real de la reparación sea mayor.
                    </p>
                    <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-md border border-blue-200 bg-white p-3">
                      <Checkbox
                        checked={data.acepta_condiciones}
                        onCheckedChange={(v) => update("acepta_condiciones", Boolean(v))}
                        className="mt-0.5"
                      />
                      <span className="text-sm font-medium">
                        He leído, comprendo y acepto las condiciones y los límites económicos de esta garantía.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={prev} disabled={step === 1 || submitting}>
            <ArrowLeft className="mr-1" /> Anterior
          </Button>
          {step < 3 ? (
            <Button onClick={next} className="bg-primary text-primary-foreground hover:brightness-110">
              Siguiente <ArrowRight className="ml-1" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={submitting || !data.acepta_condiciones || !detectedTier}
              className="bg-primary text-primary-foreground hover:brightness-110"
            >
              {submitting ? <Loader2 className="mr-1 animate-spin" /> : isEdit ? <Save className="mr-1" /> : <ShieldCheck className="mr-1" />}
              {isEdit ? "Guardar cambios" : "Confirmar y generar contrato"}
            </Button>
          )}
        </div>
        </>)}
      </main>
    </div>
  );
};

export default NewWarranty;