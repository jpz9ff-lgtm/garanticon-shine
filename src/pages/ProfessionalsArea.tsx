import { FlyingBot } from "@/components/garanticon/FlyingBot";
import { Footer } from "@/components/garanticon/Footer";
import { Navbar } from "@/components/garanticon/Navbar";
import { ProfessionalsAccess } from "@/components/garanticon/ProfessionalsAccess";
import { WhatsAppButton } from "@/components/garanticon/WhatsAppButton";

const ProfessionalsArea = () => {
  const handleNavigate = (id: string) => {
    if (id === "hero") window.location.href = "/";
    if (id === "lookup") window.location.href = "/mi-poliza";
    if (id === "assistance") window.location.href = "/asistencia";
  };

  return (
    <main className="min-h-screen bg-background pt-24">
      <h1 className="sr-only">Profesionales Garanticon — Acceso para talleres y concesionarios</h1>
      <Navbar onNavigate={handleNavigate} />
      <FlyingBot />
      <WhatsAppButton />
      <ProfessionalsAccess />
      <Footer />
    </main>
  );
};

export default ProfessionalsArea;