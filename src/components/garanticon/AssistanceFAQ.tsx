import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "¿Qué hago si mi vehículo tiene una avería?",
    a: "Comunícala a Garanticon en un plazo máximo de 3 días hábiles desde su aparición y antes de iniciar cualquier reparación. Puedes hacerlo por teléfono, WhatsApp, email o usando el formulario de esta página. Sin un número de autorización previo, ninguna reparación generará obligación de pago.",
  },
  {
    q: "¿Cuál es el periodo de carencia de la garantía?",
    a: "La garantía no produce efecto durante los primeros 15 días naturales y 1.000 km desde la fecha de venta reflejada en el certificado. Las averías manifestadas dentro de ese periodo quedan excluidas de cobertura.",
  },
  {
    q: "¿Cuál es el límite económico por avería?",
    a: "Modalidad PLUS: 5.000 € IVA incluido por avería. Modalidad BASIC: 2.500 € IVA incluido por avería. El límite total acumulado es el precio de venta del vehículo en ambas modalidades.",
  },
  {
    q: "¿Qué piezas están cubiertas?",
    a: "Motor, cambio (manual y automático), embrague, aire acondicionado, sistema eléctrico, dirección, frenos (ABS, bomba y servofreno), alimentación (inyectores, turbo, ECU) y refrigeración. Consulta el contrato para ver el listado completo y las exclusiones.",
  },
  {
    q: "¿Necesito hacer revisiones obligatorias?",
    a: "Sí. Debes realizar una revisión cada 12 meses o 12.000 km (lo que antes ocurra), incluyendo cambio de aceite y filtro, comprobación de niveles y revisión de la correa o cadena de distribución. Conserva las facturas: la falta de mantenimiento anula la garantía.",
  },
  {
    q: "¿Qué hago si vendo el vehículo?",
    a: "La garantía está vinculada al propietario original y al vehículo. Cualquier transmisión de propiedad produce la extinción automática e inmediata de la garantía, sin derecho a reembolso.",
  },
  {
    q: "¿Puedo llevar el coche a cualquier taller?",
    a: "No. Las reparaciones deben realizarse en talleres autorizados previamente por Garanticon. Antes de iniciar cualquier intervención, llámanos para que te indiquemos el taller adecuado y te facilitemos el número de autorización.",
  },
  {
    q: "¿La cobertura es válida fuera de España?",
    a: "La cobertura se limita al territorio nacional español (Península e Islas). Las averías fuera de España no generan obligación de pago salvo autorización expresa y previa por escrito de Garanticon.",
  },
];

export const AssistanceFAQ = () => {
  return (
    <section id="faq" className="bg-muted/30 px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Preguntas frecuentes</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-foreground md:text-4xl">
            Respuestas a las dudas más habituales
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            ¿No encuentras lo que buscas? Escríbenos por el formulario de abajo y te responderemos en menos de 24 h.
          </p>
        </div>

        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {faqs.map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="overflow-hidden rounded-2xl border-0 bg-card px-5 shadow-soft"
            >
              <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};