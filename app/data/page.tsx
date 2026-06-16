import { Download, FileJson, FileSpreadsheet } from "lucide-react";

import { DataImport } from "@/components/data-import";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  listInsights,
  listModels,
  listProjects,
  listSessions,
  listTools,
} from "@/db/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Data & backup" };

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-muted/30 rounded-lg border px-3 py-2.5 text-center">
      <p className="tabnum text-xl font-semibold">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

export default async function DataPage() {
  const [projects, tools, models, sessions, insights] = await Promise.all([
    listProjects(),
    listTools(),
    listModels(),
    listSessions(),
    listInsights(),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Data & backup"
        description="Export your journal for safekeeping, or restore from a backup."
      />

      <Card className="mb-4">
        <CardContent className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-5">
          <Count label="Sessions" value={sessions.length} />
          <Count label="Models" value={models.length} />
          <Count label="Tools" value={tools.length} />
          <Count label="Projects" value={projects.length} />
          <Count label="Insights" value={insights.length} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard
          title="Export"
          description="Download your data. JSON is a full backup; CSV is sessions only."
          contentClassName="flex flex-wrap gap-2"
        >
          <a
            href="/api/export/json"
            download
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <FileJson />
            Export JSON backup
          </a>
          <a
            href="/api/export/csv"
            download
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <FileSpreadsheet />
            Export sessions CSV
          </a>
        </SectionCard>

        <SectionCard
          title="Import"
          description="Restore from a JSON backup. Existing records (matched by id) are skipped, so importing is safe to repeat."
          contentClassName="flex flex-col items-start gap-3"
        >
          <DataImport />
          <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <Download className="size-3.5" />
            Only ModelBench JSON backups are supported.
          </p>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
