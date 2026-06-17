import Link from "next/link";
import { ArrowLeft, GitCompareArrows, Swords } from "lucide-react";

import { ConfidenceDot, ScoreBadge } from "@/components/badges";
import { VersusRadar } from "@/components/charts/versus-radar";
import { SortSelect } from "@/components/filters/sort-select";
import { VersusControls } from "@/components/filters/versus-controls";
import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { StatsLeaderboard } from "@/components/tables/stats-leaderboard";
import { ToneBadge } from "@/components/tone-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listModels, listSessions } from "@/db/queries";
import { leaderboardSortOptions, taskTypeLabels } from "@/lib/constants";
import {
  formatCurrency,
  formatMinutes,
  formatPercent,
  formatScore,
} from "@/lib/format";
import {
  byModel,
  leaderboard,
  sortLeaderboard,
  type LeaderboardSortKey,
} from "@/lib/metrics";
import { headToHead, type StatDelta } from "@/lib/metrics/versus";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Compare models" };

function fmt(value: number | null, format: StatDelta["format"]): string {
  if (value == null) return "—";
  switch (format) {
    case "score":
      return formatScore(value);
    case "currency":
      return formatCurrency(value);
    case "minutes":
      return formatMinutes(value);
    case "percent":
      return formatPercent(value);
    case "int":
      return String(value);
  }
}

export default async function CompareModelsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; a?: string; b?: string }>;
}) {
  const { sort, a, b } = await searchParams;
  const [sessions, models] = await Promise.all([listSessions(), listModels()]);
  const rows = sortLeaderboard(
    leaderboard(sessions, byModel),
    (sort as LeaderboardSortKey) ?? "quality",
  );

  const modelOptions = models.map((m) => ({
    value: m.id,
    label: m.shortName ?? m.name,
  }));
  const labelOf = (id: string) =>
    modelOptions.find((o) => o.value === id)?.label ?? "Model";

  const valid = !!a && !!b && a !== b && models.some((m) => m.id === a) &&
    models.some((m) => m.id === b);
  const versus = valid
    ? headToHead(
        labelOf(a!),
        labelOf(b!),
        sessions.filter((s) => s.model?.id === a),
        sessions.filter((s) => s.model?.id === b),
      )
    : null;

  return (
    <PageContainer>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground -ml-2 mb-2"
        render={<Link href="/models" />}
      >
        <ArrowLeft />
        Models
      </Button>
      <PageHeader
        title="Compare models"
        description="Put two models head-to-head, or scan value across every model with logged sessions."
      >
        {models.length >= 2 ? <VersusControls models={modelOptions} /> : null}
      </PageHeader>

      {/* Head-to-head */}
      {versus ? (
        <div className="mb-8 flex flex-col gap-4">
          <SectionCard
            title={`${labelOf(a!)} vs ${labelOf(b!)}`}
            description="Side-by-side across your logged sessions."
          >
            <div className="mb-4 flex items-start gap-3">
              <Swords className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <ToneBadge tone={versus.verdict.tone}>
                {versus.verdict.text}
              </ToneBadge>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <VersusRadar
                data={versus.radar}
                aLabel={labelOf(a!)}
                bLabel={labelOf(b!)}
              />
              <div className="scrollbar-thin overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-right">
                        <span className="inline-flex items-center gap-1.5">
                          <ConfidenceDot
                            value={versus.statsA.confidence}
                            count={versus.statsA.count}
                          />
                          {labelOf(a!)}
                        </span>
                      </TableHead>
                      <TableHead className="text-center">Metric</TableHead>
                      <TableHead>
                        <span className="inline-flex items-center gap-1.5">
                          <ConfidenceDot
                            value={versus.statsB.confidence}
                            count={versus.statsB.count}
                          />
                          {labelOf(b!)}
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versus.stats.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell
                          className={cn(
                            "tabnum text-right",
                            row.winner === "a" && "text-success font-semibold",
                          )}
                        >
                          {fmt(row.a, row.format)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-center text-xs">
                          {row.label}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "tabnum",
                            row.winner === "b" && "text-success font-semibold",
                          )}
                        >
                          {fmt(row.b, row.format)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </SectionCard>

          {versus.byTask.length > 0 ? (
            <SectionCard
              title="By task type"
              description="Average quality where both models have sessions."
              contentClassName="p-0"
            >
              <div className="scrollbar-thin overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Task type</TableHead>
                      <TableHead className="text-center">{labelOf(a!)}</TableHead>
                      <TableHead className="text-center">{labelOf(b!)}</TableHead>
                      <TableHead className="text-right">Δ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versus.byTask.map((r) => (
                      <TableRow key={r.taskType}>
                        <TableCell className="font-medium">
                          {taskTypeLabels[r.taskType]}
                        </TableCell>
                        <TableCell className="text-center">
                          <ScoreBadge value={r.a} />
                        </TableCell>
                        <TableCell className="text-center">
                          <ScoreBadge value={r.b} />
                        </TableCell>
                        <TableCell
                          className={cn(
                            "tabnum text-right text-sm font-medium",
                            r.winner === "a" && "text-success",
                            r.winner === "b" && "text-destructive",
                          )}
                        >
                          {r.delta == null
                            ? "—"
                            : `${r.delta > 0 ? "+" : ""}${formatScore(r.delta)}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
          ) : null}
        </div>
      ) : models.length >= 2 ? (
        <SectionCard
          title="Head-to-head"
          description="Pick two models above to compare them directly."
        >
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Swords className="size-4" />
            Choose model A and model B to see a radar overlay, stat deltas and a
            per-task breakdown.
          </p>
        </SectionCard>
      ) : null}

      {/* Full leaderboard */}
      {rows.length === 0 ? (
        <EmptyState
          icon={GitCompareArrows}
          title="Nothing to compare yet"
          description="Log sessions with models attached to build the comparison."
        />
      ) : (
        <SectionCard
          title="All models"
          description="Every model with logged sessions."
          action={<SortSelect options={leaderboardSortOptions} />}
          contentClassName="p-0"
        >
          <div className="px-4 pb-4">
            <StatsLeaderboard
              rows={rows}
              hrefBase="/models/"
              nameLabel="Model"
              rank
            />
          </div>
        </SectionCard>
      )}
    </PageContainer>
  );
}
