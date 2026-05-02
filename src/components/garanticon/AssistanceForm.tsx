import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface Props {
  prefillPlate?: string;
  prefillPolicy?: string;
  embedded?: boolean;
}

const inputCls =
  "h-12 rounded-xl border-border bg-background text-base transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

const formSchema = z.object({
  nombre: z.string().trim().min(2, "Nombre demasiado corto").max(200),
  telefono: z.string().trim().min(6, "Teléfono inválido").max(25),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  matricula: z.string().trim().max(20).optional().or(z.literal("")),
  numero_poliza: z.string().trim().max(50).optional().or(z.literal("")),
  tipo: z.string().min(1, "Selecciona un tipo"),
  descripcion: z.string().trim().min(10, "Cuéntanos algo más (mínimo 10 caracteres)").max(2000),
});

export const AssistanceForm = ({ prefillPlate = "", prefillPolicy = "", embedded = false }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      nombre: String(fd.get("nombre") || ""),
      telefono: String(fd.get("telefono") || ""),
      email: String(fd.get("email") || ""),
      matricula: String(fd.get("matricula") || "").toUpperCase(),
      numero_poliza: String(fd.get("numero_poliza") || "").toUpperCase(),
      tipo: type,
      descripcion: String(fd.get("descripcion") || ""),
    };

    const parsed = formSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path.join(".")] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const mensajeFinal = `[${parsed.data.tipo.toUpperCase()}] ${parsed.data.descripcion}\n\n— ${parsed.data.nombre} · Tel: ${parsed.data.telefono}`;

    const { error } = await supabase.from("contacts").insert({
      nombre: parsed.data.nombre,
      email: parsed.data.email || null,
      matricula: parsed.data.matricula || null,
      numero_poliza: parsed.data.numero_poliza || null,
      mensaje: mensajeFinal,
    });

    setSubmitting(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "No pudimos enviar tu consulta. Inténtalo de nuevo." });
      return;
    }
    setSubmitted(true);
  };

  const errMsg = (k: string) =>
    errors[k] && <p className="text-xs font-medium text-destructive">{errors[k]}</p>;

  return (
    <section id={embedded ? "assistance-form" : "assistance"} ref={ref} className={embedded ? "bg-background" : "bg-background px-6 py-24"}>
      <div className="mx-auto max-w-3xl">
        {!embedded && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center text-3xl font-bold text-foreground md:text-5xl"
          >
            ¿Necesitas ayuda? Estamos aquí
          </motion.h2>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className={`${embedded ? "mt-0" : "mt-12"} rounded-3xl bg-card p-8 shadow-soft md:p-10`}
        >
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="ok"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-soft"
                >
                  <Check size={40} strokeWidth={3} />
                </motion.div>
                <h3 className="mt-6 text-2xl font-bold text-foreground">¡Consulta enviada!</h3>
                <p className="mt-2 text-muted-foreground">
                  Nuestro equipo se pondrá en contacto contigo en menos de 24 horas.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={onSubmit}
                className="grid gap-5 md:grid-cols-2"
              >
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nombre" className="text-sm font-semibold">Nombre completo *</Label>
                  <Input id="nombre" name="nombre" required className={inputCls} />
                  {errMsg("nombre")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono" className="text-sm font-semibold">Teléfono *</Label>
                  <Input id="telefono" name="telefono" type="tel" required className={inputCls} />
                  {errMsg("telefono")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                  <Input id="email" name="email" type="email" className={inputCls} />
                  {errMsg("email")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matricula" className="text-sm font-semibold">Matrícula</Label>
                  <Input id="matricula" name="matricula" defaultValue={prefillPlate} className={`${inputCls} uppercase`} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_poliza" className="text-sm font-semibold">Número de póliza</Label>
                  <Input id="numero_poliza" name="numero_poliza" defaultValue={prefillPolicy} className={inputCls} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-semibold">Tipo de consulta *</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className={inputCls}>
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="averia">Dar parte de avería</SelectItem>
                      <SelectItem value="siniestro">Siniestro / reclamación</SelectItem>
                      <SelectItem value="poliza">Consulta sobre mi póliza</SelectItem>
                      <SelectItem value="general">Consulta general</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                  {errMsg("tipo")}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="descripcion" className="text-sm font-semibold">Descripción *</Label>
                  <Textarea
                    id="descripcion"
                    name="descripcion"
                    rows={5}
                    required
                    placeholder="Cuéntanos qué ha pasado: síntomas de la avería, fecha, taller, etc."
                    className="rounded-xl border-border bg-background text-base transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                  {errMsg("descripcion")}
                </div>
                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-all hover:scale-[1.02] hover:brightness-110"
                  >
                    {submitting ? <><Loader2 className="mr-2 animate-spin" /> Enviando…</> : "Enviar consulta"}
                  </Button>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Al enviar aceptas que contactemos contigo para gestionar tu solicitud.
                  </p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};