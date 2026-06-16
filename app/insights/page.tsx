import Link from "next/link";
import { Boxes, FolderKanban, Lightbulb, Plus, Wrench } from "lucide-react";

import { ConfidenceBadge, InsightStatusBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { SortSelect } from "@/components/filters/sort-select";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { RowActions } from "@/components/tables/row-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteInsight } from "@/app/insights/actions";
import { listInsights } from "@/db/queries";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { INSIGHT_STATUSES } from "@/db/schema";
import type { InsightStatus } from "@/types";
import type { Option } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Insights" };

const statusFilterOptions: Option[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "confirmed", label: "Confirmed" },
  { value: "outdated", label: "Outdated" },
];

function LinkChip({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Boxes;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="bg-muted hover:bg-accent text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-colors"
    >
      <Icon className="size-3" />
      {label}
    </Link>
  );
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const validStatus = (INSIGHT_STATUSES as readonly string[]).includes(
    status ?? "",
  )
    ? (status as InsightStatus)
    : undefined;
  const insights = await listInsights(
    validStatus ? { status: validStatus } : {},
  );

  return (
    <PageContainer>
      <PageHeader
        title="Insights"
        description="Your durable observations about how each model and tool behaves."
      >
        <SortSelect param="status" options={statusFilterOptions} />
        <Button render={<Link href="/insights/new" />}>
          <Plus />
          New insight
        </Button>
      </PageHeader>

      {insights.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title={validStatus ? "No insights with this status" : "No insights yet"}
          description="Capture what you learn — e.g. “Claude Code is better for large UI refactors, but Codex wins when image-generation context matters.”"
        >
          <Button render={<Link href="/insights/new" />}>
            <Plus />
            Add an insight
          </Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {insights.map((i) => (
            <Card key={i.id} className={cn("flex flex-col")}>
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-snug">{i.title}</h3>
                  <RowActions
                    entityLabel="Insight"
                    name={i.title}
                    editHref={`/insights/${i.id}/edit`}
                    onDelete={deleteInsight.bind(null, i.id)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <InsightStatusBadge value={i.status} />
                  <ConfidenceBadge value={i.confidence} />
                </div>
                {i.description ? (
                  <p className="text-muted-foreground flex-1 text-sm whitespace-pre-wrap">
                    {i.description}
                  </p>
                ) : (
                  <div className="flex-1" />
                )}
                <div className="flex flex-wrap items-center gap-1.5">
                  {i.model ? (
                    <LinkChip
                      href={`/models/${i.model.id}`}
                      icon={Boxes}
                      label={i.model.shortName ?? i.model.name}
                    />
                  ) : null}
                  {i.tool ? (
                    <LinkChip
                      href={`/tools/${i.tool.id}`}
                      icon={Wrench}
                      label={i.tool.name}
                    />
                  ) : null}
                  {i.project ? (
                    <LinkChip
                      href={`/projects/${i.project.id}`}
                      icon={FolderKanban}
                      label={i.project.name}
                    />
                  ) : null}
                </div>
                <p className="text-muted-foreground/70 text-xs">
                  Updated {formatRelative(i.updatedAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
