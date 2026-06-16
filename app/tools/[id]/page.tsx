import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";

import { EntityDashboard } from "@/components/entity-dashboard";
import { DeleteAction } from "@/components/delete-action";
import { PageContainer } from "@/components/layout/page-header";
import { ToneBadge } from "@/components/tone-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteTool } from "@/app/tools/actions";
import { getToolById, listSessions } from "@/db/queries";
import { toolCategoryLabels } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = await getToolById(id);
  if (!tool) notFound();
  const sessions = await listSessions({ toolId: id });

  return (
    <PageContainer>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground -ml-2 mb-2"
        render={<Link href="/tools" />}
      >
        <ArrowLeft />
        Tools
      </Button>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{tool.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <ToneBadge tone="neutral">
              {toolCategoryLabels[tool.category]}
            </ToneBadge>
            {tool.website ? (
              <a
                href={tool.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-sm"
              >
                <ExternalLink className="size-3.5" />
                {tool.website.replace(/^https?:\/\//, "")}
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/tools/${tool.id}/edit`} />}
          >
            <Pencil />
            Edit
          </Button>
          <DeleteAction
            entityLabel="Tool"
            name={tool.name}
            redirectTo="/tools"
            action={deleteTool.bind(null, tool.id)}
          />
        </div>
      </div>

      {tool.notes ? (
        <Card className="mb-4">
          <CardContent className="p-5 text-sm whitespace-pre-wrap">
            {tool.notes}
          </CardContent>
        </Card>
      ) : null}

      <EntityDashboard
        sessions={sessions}
        emptyHint="No sessions logged with this tool yet."
      />
    </PageContainer>
  );
}
