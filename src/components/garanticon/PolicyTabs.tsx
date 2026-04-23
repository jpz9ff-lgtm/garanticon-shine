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