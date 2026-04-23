import { useState } from "react";
import { Hero } from "@/components/garanticon/Hero";
import { WarrantyLookup, type LookupResult } from "@/components/garanticon/WarrantyLookup";
import { AssistanceForm } from "@/components/garanticon/AssistanceForm";
import { Footer } from "@/components/garanticon/Footer";

const Index = () => {
  const [lookup, setLookup] = useState<LookupResult>({ plate: "", policy: "" });

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="min-h-screen bg-background">
      <h1 className="sr-only">Garanticon — Garantía premium para tu coche en España</h1>
      <Hero onCta={() => scrollTo("lookup")} />
      <WarrantyLookup onResult={setLookup} onRequestAssistance={() => scrollTo("assistance")} />
      <AssistanceForm prefillPlate={lookup.plate} prefillPolicy={lookup.policy} />
      <Footer />
    </main>
  );
};

export default Index;
