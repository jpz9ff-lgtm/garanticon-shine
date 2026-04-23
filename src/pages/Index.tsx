import { useNavigate } from "react-router-dom";
import { Hero } from "@/components/garanticon/Hero";
import { Footer } from "@/components/garanticon/Footer";
import { FlyingBot } from "@/components/garanticon/FlyingBot";
import { Intro } from "@/components/garanticon/Intro";
import { Navbar } from "@/components/garanticon/Navbar";
import { WhatsAppButton } from "@/components/garanticon/WhatsAppButton";

const Index = () => {
  const navigate = useNavigate();

  const handleNavigate = (id: string) => {
    if (id === "lookup") {
      navigate("/mi-poliza");
      return;
    }

    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen bg-background">
      <h1 className="sr-only">Garanticon — Garantía premium para tu coche en España</h1>
      <Navbar onNavigate={handleNavigate} />
      <FlyingBot />
      <WhatsAppButton />
      <Hero onCta={() => navigate("/mi-poliza")} />
      <Intro />
      <Footer />
    </main>
  );
};

export default Index;
