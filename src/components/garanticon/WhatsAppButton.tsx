import { MessageCircle } from "lucide-react";

export const WhatsAppButton = () => {
  return (
    <a
      href="https://api.whatsapp.com/send?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20mi%20garant%C3%ADa"
      target="_blank"
      rel="noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform duration-300 hover:scale-110 md:bottom-8 md:right-8 md:h-16 md:w-16"
    >
      <MessageCircle size={30} strokeWidth={2.4} />
    </a>
  );
};