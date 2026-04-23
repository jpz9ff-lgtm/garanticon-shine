import { AssistanceForm } from "./AssistanceForm";
import { WarrantyLookup, type LookupResult } from "./WarrantyLookup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PolicyTabsProps {
  lookup: LookupResult;
  onResult: (r: LookupResult) => void;
}

export const PolicyTabs = ({ lookup, onResult }: PolicyTabsProps) => {
  return (
    <section id="lookup" className="bg-background px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Mi póliza</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-foreground md:text-5xl">
            Tu área privada como cliente de Garanticon
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Aquí podrás consultar el estado de tu póliza, revisar siniestros, comprobar tus
            coberturas y acceder a toda la información relevante de tu garantía. Introduce tus
            datos para continuar.
          </p>
        </div>

        <Tabs defaultValue="policy" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-1 rounded-2xl bg-muted p-1 md:grid-cols-2">
            <TabsTrigger value="policy" className="rounded-xl px-4 py-4 text-base font-bold">
              Consulta el estado de tu póliza
            </TabsTrigger>
            <TabsTrigger value="assistance" className="rounded-xl px-4 py-4 text-base font-bold">
              ¿Necesitas ayuda?
            </TabsTrigger>
          </TabsList>

          <TabsContent value="policy" className="mt-8">
            <WarrantyLookup onResult={onResult} onRequestAssistance={() => undefined} embedded />
          </TabsContent>
          <TabsContent id="assistance" value="assistance" className="mt-8">
            <AssistanceForm prefillPlate={lookup.plate} prefillPolicy={lookup.policy} embedded />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};