import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-react";

interface Props {
  prefillPlate?: string;
  prefillPolicy?: string;
}

const inputCls =
  "h-12 rounded-xl border-border bg-background text-base transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

export const AssistanceForm = ({ prefillPlate = "", prefillPolicy = "" }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [submitted, setSubmitted] = useState(false);
  const [type, setType] = useState<string>("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="assistance" ref={ref} className="bg-background px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center text-3xl font-bold text-foreground md:text-5xl"
        >
          ¿Necesitas ayuda? Estamos aquí
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-12 rounded-3xl bg-card p-8 shadow-soft md:p-10"
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
                  <Label htmlFor="name" className="text-sm font-semibold">Nombre completo</Label>
                  <Input id="name" required className={inputCls} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold">Teléfono</Label>
                  <Input id="phone" type="tel" required className={inputCls} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                  <Input id="email" type="email" required className={inputCls} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aplate" className="text-sm font-semibold">Matrícula</Label>
                  <Input id="aplate" defaultValue={prefillPlate} className={`${inputCls} uppercase`} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apolicy" className="text-sm font-semibold">Número de póliza</Label>
                  <Input id="apolicy" defaultValue={prefillPolicy} className={inputCls} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-semibold">Tipo de consulta</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className={inputCls}>
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="averia">Avería</SelectItem>
                      <SelectItem value="siniestro">Siniestro</SelectItem>
                      <SelectItem value="general">Consulta general</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="desc" className="text-sm font-semibold">Descripción del problema</Label>
                  <Textarea
                    id="desc"
                    rows={4}
                    required
                    className="rounded-xl border-border bg-background text-base transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-all hover:scale-[1.02] hover:brightness-110"
                  >
                    Enviar consulta
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};