import { AssistanceContact } from "@/components/garanticon/AssistanceContact";
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
      <Footer />
    </main>
  );
};

export default AssistanceArea;