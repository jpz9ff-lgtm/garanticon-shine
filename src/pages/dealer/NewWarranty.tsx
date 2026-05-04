import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Save, ShieldCheck } from "lucide-react";
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
import { toast } from "@/components/ui/use-toast";
import {
  compradorSchema,
  vehiculoSchema,
  garantiaSchema,
  isPlusEligible,
  limiteAveriaFor,
} from "@/lib/garanticon-validators";

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
  // garantia
  modalidad: "PLUS" | "BASIC"; fecha_venta: string; fecha_inicio: string; fecha_fin: string;
};

const empty: FormState = {
  comprador_nombre: "", comprador_dni: "", comprador_telefono: "", comprador_email: "",
  comprador_direccion: "", comprador_cp: "", comprador_poblacion: "", comprador_provincia: "",
  vehiculo_marca: "", vehiculo_modelo: "", matricula: "", bastidor: "",
  fecha_matriculacion: "", km_venta: "", precio_venta: "",
  combustible: "Gasolina", tipo_cambio: "Manual", traccion_4x4: false,
  modalidad: "BASIC",
  fecha_venta: format(new Date(), "yyyy-MM-dd"),
  fecha_inicio: format(new Date(), "yyyy-MM-dd"),
  fecha_fin: format(addMonths(new Date(), 12), "yyyy-MM-dd"),
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
          modalidad: w.modalidad as "PLUS" | "BASIC",
          fecha_venta: w.fecha_venta ?? "",
          fecha_inicio: w.fecha_inicio ?? "",
          fecha_fin: w.fecha_fin ?? "",
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
      return next;
    });
  };

  const plusOk = useMemo(
    () => isPlusEligible(data.fecha_matriculacion, Number(data.km_venta || 0)),
    [data.fecha_matriculacion, data.km_venta],
  );

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

    if (data.modalidad === "PLUS" && !plusOk) {
      toast({ variant: "destructive", title: "Modalidad no permitida",
        description: "PLUS requiere vehículo con menos de 15 años y menos de 220.000 km." });
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
          modalidad: data.modalidad,
          limite_averia: limiteAveriaFor(data.modalidad),
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
                <Label>DNI / NIF *</Label>
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
              <CardTitle>3. Garantía</CardTitle>
              <CardDescription>Selecciona modalidad y vigencia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={data.modalidad} onValueChange={(v) => update("modalidad", v as "PLUS" | "BASIC")} className="grid gap-3 md:grid-cols-2">
                <label className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-4 ${data.modalidad === "PLUS" ? "border-primary ring-2 ring-primary/30" : ""} ${!plusOk ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="PLUS" disabled={!plusOk} />
                    <span className="font-bold text-primary">PLUS</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Vehículos &lt; 15 años y &lt; 220.000 km. Límite 5.000€ IVA inc.</p>
                  {!plusOk && data.fecha_matriculacion && (
                    <p className="text-xs font-medium text-destructive">No disponible para este vehículo.</p>
                  )}
                </label>
                <label className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-4 ${data.modalidad === "BASIC" ? "border-purple-600 ring-2 ring-purple-300" : ""}`}>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="BASIC" />
                    <span className="font-bold text-purple-700">BASIC</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Vehículos ≥ 15 años o ≥ 220.000 km. Límite 2.500€ IVA inc.</p>
                </label>
              </RadioGroup>

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

              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium">Resumen</p>
                <p className="text-muted-foreground">
                  Modalidad <span className="font-semibold">{data.modalidad}</span> · Límite por avería{" "}
                  <span className="font-semibold">{limiteAveriaFor(data.modalidad).toLocaleString("es-ES")}€</span>
                </p>
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
            <Button onClick={submit} disabled={submitting} className="bg-primary text-primary-foreground hover:brightness-110">
              {submitting ? <Loader2 className="mr-1 animate-spin" /> : isEdit ? <Save className="mr-1" /> : <ShieldCheck className="mr-1" />}
              {isEdit ? "Guardar cambios" : "Emitir Garantía"}
            </Button>
          )}
        </div>
        </>)}
      </main>
    </div>
  );
};

export default NewWarranty;