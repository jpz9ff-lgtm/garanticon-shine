import { useState } from "react";
import { Hero } from "@/components/garanticon/Hero";
import { type LookupResult } from "@/components/garanticon/WarrantyLookup";
import { Footer } from "@/components/garanticon/Footer";
import { FlyingBot } from "@/components/garanticon/FlyingBot";
import { Intro } from "@/components/garanticon/Intro";
import { Navbar } from "@/components/garanticon/Navbar";
import { PolicyTabs } from "@/components/garanticon/PolicyTabs";
import { WhatsAppButton } from "@/components/garanticon/WhatsAppButton";

const Index = () => {
  const [lookup, setLookup] = useState<LookupResult>({ plate: "", policy: "" });

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="min-h-screen bg-background">
      <h1 className="sr-only">Garanticon — Garantía premium para tu coche en España</h1>
      <Navbar onNavigate={scrollTo} />
      <FlyingBot />
      <WhatsAppButton />
      <Hero onCta={() => scrollTo("lookup")} />
      <Intro />
      <PolicyTabs lookup={lookup} onResult={setLookup} />
      <Footer />
    </main>
  );
};

export default Index;
