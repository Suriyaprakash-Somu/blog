"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptsTable } from "@/modules/platform/prompts/PromptsTable";
import { TemplatesTable } from "@/modules/platform/prompts/TemplatesTable";
import { PageShell } from "@/components/layout/PageShell";

export default function PromptsPage() {
  const [activeTab, setActiveTab] = useState<"prompts" | "templates">("prompts");

  return (
    <PageShell>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList>
            <TabsTrigger value="prompts">System Prompts</TabsTrigger>
            <TabsTrigger value="templates">Generation Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="prompts" className="space-y-4">
            <PromptsTable />
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4">
            <TemplatesTable />
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
