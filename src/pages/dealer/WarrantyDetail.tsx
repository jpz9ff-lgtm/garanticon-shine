import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { DealerHeader } from "@/components/dealer/DealerHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

type W = {
  id: string; numero_poliza: string;
  comprador_nombre: string; comprador_dni: string; comprador_telefono: string | null;
  comprador_email: string | null; comprador_direccion: string | null; comprador_cp: string | null;
  comprador_poblacion: string | null; comprador_provincia: string | null;
  vehiculo_marca: string; vehiculo_modelo: string; matricula: string; bastidor: string | null;
  fecha_matriculacion: string | null; km_venta: number | null; precio_venta: number | null;
  combustible: string | null; tipo_cambio: string | null; traccion_4x4: boolean;
  modalidad: "PLUS" | "BASIC"; limite_averia: number;
  fecha_venta: string; fecha_inicio: string; fecha_fin: string;
  estado: "activa" | "expirada" | "cancelada";
};

const WarrantyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [w, setW] = useState<W | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from("warranties").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (error) toast({ variant: "destructive", title: "Error", description: error.message });
      setW(data as W | null);
      setLoading(false);
    });
  }, [id]);

  const fmt = (d?: string | null) => d ? format(new Date(d), "dd/MM/yyyy", { locale: es }) : "-";

  return (
    <div className="min-h-screen bg-muted/20">
      <DealerHeader />
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" asChild>
            <Link to="/dealer/dashboard"><ArrowLeft className="mr-1" /> Volver al panel</Link>
          </Button>
          <Button
            onClick={() => toast({ title: "Generación de PDF", description: "Disponible en el siguiente paso." })}
            className="bg-primary text-primary-foreground hover:brightness-110"
          >
            <Printer className="mr-1" /> Imprimir contrato
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 animate-spin" /> Cargando…
          </div>
        ) : !w ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Garantía no encontrada.</CardContent></Card>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="font-mono text-xl">{w.numero_poliza}</CardTitle>
                  <p className="text-sm text-muted-foreground">Vigencia {fmt(w.fecha_inicio)} → {fmt(w.fecha_fin)}</p>
                </div>
                <div className="flex gap-2">
                  {w.modalidad === "PLUS"
                    ? <Badge className="bg-primary hover:bg-primary">PLUS</Badge>
                    : <Badge className="bg-purple-600 hover:bg-purple-600">BASIC</Badge>}
                  {w.estado === "activa" ? <Badge className="bg-emerald-500 hover:bg-emerald-500">Activa</Badge>
                    : w.estado === "expirada" ? <Badge variant="secondary">Expirada</Badge>
                    : <Badge variant="destructive">Cancelada</Badge>}
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-primary/10 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Límite por avería</p>
                  <p className="text-2xl font-bold text-primary">{Number(w.limite_averia).toLocaleString("es-ES")}€</p>
                </div>
                <div className="rounded-lg bg-purple-100 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Límite total</p>
                  <p className="text-2xl font-bold text-purple-700">{w.precio_venta ? Number(w.precio_venta).toLocaleString("es-ES") + "€" : "-"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Comprador</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
                <Field label="Nombre / Razón social" value={w.comprador_nombre} />
                <Field label="DNI / NIF" value={w.comprador_dni} />
                <Field label="Teléfono" value={w.comprador_telefono} />
                <Field label="Email" value={w.comprador_email} />
                <Field label="Dirección" value={w.comprador_direccion} />
                <Field label="CP" value={w.comprador_cp} />
                <Field label="Población" value={w.comprador_poblacion} />
                <Field label="Provincia" value={w.comprador_provincia} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Vehículo</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
                <Field label="Marca" value={w.vehiculo_marca} />
                <Field label="Modelo" value={w.vehiculo_modelo} />
                <Field label="Matrícula" value={w.matricula} />
                <Field label="Bastidor" value={w.bastidor} />
                <Field label="Fecha matriculación" value={fmt(w.fecha_matriculacion)} />
                <Field label="Km en venta" value={w.km_venta?.toLocaleString("es-ES")} />
                <Field label="Precio venta" value={w.precio_venta ? Number(w.precio_venta).toLocaleString("es-ES") + "€" : null} />
                <Field label="Combustible" value={w.combustible} />
                <Field label="Cambio" value={w.tipo_cambio} />
                <Field label="Tracción 4x4" value={w.traccion_4x4 ? "Sí" : "No"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Garantía</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3 text-sm">
                <Field label="Fecha de venta" value={fmt(w.fecha_venta)} />
                <Field label="Inicio cobertura" value={fmt(w.fecha_inicio)} />
                <Field label="Fin cobertura" value={fmt(w.fecha_fin)} />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div>
    <p className="text-xs uppercase text-muted-foreground">{label}</p>
    <p className="font-medium">{value || "—"}</p>
  </div>
);

export default WarrantyDetail;