import { AssistanceContact } from "@/components/garanticon/AssistanceContact";
import { AssistanceFAQ } from "@/components/garanticon/AssistanceFAQ";
import { AssistanceForm } from "@/components/garanticon/AssistanceForm";
import { FlyingBot } from "@/components/garanticon/FlyingBot";
import { Footer } from "@/components/garanticon/Footer";
import { Navbar } from "@/components/garanticon/Navbar";
import { WhatsAppButton } from "@/components/garanticon/WhatsAppButton";

const AssistanceArea = () => {
  const handleNavigate = (id: string) => {
    if (id === "hero") window.location.href = "/";
    if (id === "lookup") window.location.href = "/mi-poliza";
    if (id === "professionals") window.location.href = "/profesionales";
  };

  return (
    <main className="min-h-screen bg-background pt-24">
      <h1 className="sr-only">Asistencia Garanticon — Contacto para clientes</h1>
      <Navbar onNavigate={handleNavigate} />
      <FlyingBot />
      <WhatsAppButton />
      <AssistanceContact />
      <AssistanceFAQ />
      <section id="formulario" className="bg-background px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Escríbenos</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-foreground md:text-4xl">
              Dar parte o enviar consulta
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Rellena el formulario y nuestro equipo se pondrá en contacto contigo. Si es urgente,
              llámanos directamente al <a href="tel:+34900123456" className="font-semibold text-primary hover:underline">900 123 456</a>.
            </p>
          </div>
          <AssistanceForm embedded />
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default AssistanceArea;