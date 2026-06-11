import { Badge } from "@/components/ui/badge";
import type { Modalidad } from "@/lib/garanticon-validators";

export const modalidadLabel = (m: Modalidad | string) => {
  if (m === "ELITE") return "ÉLITE";
  return m;
};

export const modalidadBadge = (m: Modalidad | string) => {
  switch (m) {
    case "ELITE":
      return <Badge style={{ backgroundColor: "#F97316" }} className="text-white hover:opacity-90">ÉLITE</Badge>;
    case "PLUS":
      return <Badge style={{ backgroundColor: "#7C3AED" }} className="text-white hover:opacity-90">PLUS</Badge>;
    case "ESENCIAL":
      return <Badge style={{ backgroundColor: "#1C1C2E" }} className="text-white hover:opacity-90">ESENCIAL</Badge>;
    case "BASIC":
      return <Badge className="bg-purple-600 hover:bg-purple-600">BASIC</Badge>;
    default:
      return <Badge variant="secondary">{String(m)}</Badge>;
  }
};