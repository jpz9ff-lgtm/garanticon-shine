import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, Loader2, Plus, Printer, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DealerHeader } from "@/components/dealer/DealerHeader";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Warranty = {
  id: string;
  numero_poliza: string;
  comprador_nombre: string;
  matricula: string;
  modalidad: "PLUS" | "BASIC";
  fecha_inicio: string;
  fecha_fin: string;
  estado: "activa" | "expirada" | "cancelada";
  created_at: string;
};

const DealerDashboard = () => {
  const { dealer, dealerError, refreshDealer } = useAuth();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalidad, setModalidad] = useState<string>("all");
  const [estado, setEstado] = useState<string>("all");

  useEffect(() => {
    if (!dealer) {
      setWarranties([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("warranties")
      .select("id, numero_poliza, comprador_nombre, matricula, modalidad, fecha_inicio, fecha_fin, estado, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setWarranties((data ?? []) as Warranty[]);
        setLoading(false);
      });
  }, [dealer]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return warranties.filter((w) => {
      if (modalidad !== "all" && w.modalidad !== modalidad) return false;
      if (estado !== "all" && w.estado !== estado) return false;
      if (q && !w.matricula.toLowerCase().includes(q) && !w.comprador_nombre.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [warranties, search, modalidad, estado]);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = warranties.filter((w) => {
      const d = new Date(w.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      total: warranties.length,
      activas: warranties.filter((w) => w.estado === "activa").length,
      expiradasMes: thisMonth.filter((w) => w.estado === "expirada").length,
    };
  }, [warranties]);

  const fmt = (d: string) => format(new Date(d), "dd/MM/yyyy", { locale: es });

  const estadoBadge = (e: Warranty["estado"]) => {
    if (e === "activa") return <Badge className="bg-emerald-500 hover:bg-emerald-500">Activa</Badge>;
    if (e === "expirada") return <Badge variant="secondary">Expirada</Badge>;
    return <Badge variant="destructive">Cancelada</Badge>;
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <DealerHeader />
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {!dealer && (
          <Alert>
            <AlertTitle>No hemos podido cargar la ficha del profesional</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <span>{dealerError ?? "Tu sesión está iniciada, pero el backend todavía no ha devuelto los datos de la empresa."}</span>
              <Button type="button" variant="outline" onClick={() => void refreshDealer()}>
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Panel Profesional</h1>
            <p className="text-muted-foreground">Bienvenido, {dealer?.nombre_empresa ?? "área profesional"}</p>
          </div>
          <Button asChild size="lg" disabled={!dealer} className="rounded-full bg-primary font-semibold text-primary-foreground hover:brightness-110">
            <Link to="/dealer/nueva">
              <Plus className="mr-1" /> Nueva Garantía
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total emitidas</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Activas</CardDescription>
              <CardTitle className="text-3xl text-emerald-600">{stats.activas}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Expiradas este mes</CardDescription>
              <CardTitle className="text-3xl">{stats.expiradasMes}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Garantías emitidas</CardTitle>
            <CardDescription>Filtra y consulta tus pólizas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por matrícula o comprador..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={modalidad} onValueChange={setModalidad}>
                <SelectTrigger className="md:w-44"><SelectValue placeholder="Modalidad" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las modalidades</SelectItem>
                  <SelectItem value="PLUS">PLUS</SelectItem>
                  <SelectItem value="BASIC">BASIC</SelectItem>
                </SelectContent>
              </Select>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger className="md:w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="expirada">Expirada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 animate-spin" /> Cargando…
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
                No hay garantías que coincidan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Póliza</TableHead>
                      <TableHead>Comprador</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Modalidad</TableHead>
                      <TableHead>Vigencia</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-mono text-xs">{w.numero_poliza}</TableCell>
                        <TableCell className="font-medium">{w.comprador_nombre}</TableCell>
                        <TableCell className="font-mono uppercase">{w.matricula}</TableCell>
                        <TableCell>
                          {w.modalidad === "PLUS" ? (
                            <Badge className="bg-primary hover:bg-primary">PLUS</Badge>
                          ) : (
                            <Badge className="bg-purple-600 hover:bg-purple-600">BASIC</Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {fmt(w.fecha_inicio)} → {fmt(w.fecha_fin)}
                        </TableCell>
                        <TableCell>{estadoBadge(w.estado)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button asChild variant="ghost" size="icon" title="Ver">
                              <Link to={`/dealer/garantia/${w.id}`}><Eye className="h-4 w-4" /></Link>
                            </Button>
                            <Button asChild variant="ghost" size="icon" title="Imprimir">
                              <Link to={`/dealer/garantia/${w.id}?print=1`}><Printer className="h-4 w-4" /></Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DealerDashboard;