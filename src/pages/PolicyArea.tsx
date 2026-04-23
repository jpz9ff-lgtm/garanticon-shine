import { useState } from "react";
import { Footer } from "@/components/garanticon/Footer";
import { FlyingBot } from "@/components/garanticon/FlyingBot";
import { Navbar } from "@/components/garanticon/Navbar";
import { PolicyTabs } from "@/components/garanticon/PolicyTabs";
import { WhatsAppButton } from "@/components/garanticon/WhatsAppButton";
import { type LookupResult } from "@/components/garanticon/WarrantyLookup";

const PolicyArea = () => {
  const [lookup, setLookup] = useState<LookupResult>({ plate: "", policy: "" });

  const handleNavigate = (id: string) => {
    if (id === "hero") {
      window.location.href = "/";
      return;
    }

    if (id === "assistance") {
      window.location.href = "/asistencia";
      return;
    }

    if (id === "professionals") {
      window.location.href = "/profesionales";
      return;
    }

    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen bg-background pt-24">
      <h1 className="sr-only">Mi póliza Garanticon — Área privada de cliente</h1>
      <Navbar onNavigate={handleNavigate} />
      <FlyingBot />
      <WhatsAppButton />
      <PolicyTabs lookup={lookup} onResult={setLookup} />
      <Footer />
    </main>
  );
};

export default PolicyArea;