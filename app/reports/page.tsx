import Link from "next/link";
import {
  startOfMonth,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { BarChart3, TrendingUp } from "lucide-react";

import { ScoreBadge } from "@/components/badges";
import { FailureHeatmap } from "@/components/charts/failure-heatmap";
import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatsLeaderboard } from "@/components/tables/stats-leaderboard";
import { ToneBadge } from "@/components/tone-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listSessions } from "@/db/queries";
import { taskTypeLabels } from "@/lib/constants";
import {
  formatCurrency,
  formatHours,
  formatScore,
} from "@/lib/format";
import {
  bestBy,
  byModel,
  failureHeatmap,
  leaderboard,
  mean,
  netTimeSaved,
  sortLeaderboard,
  summarize,
} from "@/lib/metrics";
import type { ModelStrength, SessionWithRelations, TaskType, Tone } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Reports" };

const STRONG = new Set<ModelStrength>([
  "flagship",
  "reasoning",
  "coding-specialized",
]);

function strengthGroup(s: SessionWithRelations): "strong" | "cheap" | null {
  const lvl = s.model?.strengthLevel;
  if (!lvl) return null;
  if (STRONG.has(lvl)) return "strong";
  if (lvl === "small" || lvl === "medium") return "cheap";
  return null;
}

function pctChange(curr: number, prev: number): number | null {
  if (!prev) return null;
  return ((curr - prev) / prev) * 100;
}

function worthItVerdict(delta: number): { label: string; tone: Tone } {
  if (delta >= 1.5) return { label: "Flagship clearly worth it", tone: "success" };
  if (delta >= 0.5) return { label: "Slight edge to flagship", tone: "info" };
  if (delta <= -0.5) return { label: "Cheaper model wins", tone: "warning" };
  return { label: "Roughly equal — save money", tone: "neutral" };
}

export default async function ReportsPage() {
  const sessions = await listSessions();

  if (sessions.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Reports" description="Workflow reviews and rankings." />
        <EmptyState
          icon={BarChart3}
          title="No data to report yet"
          description="Log sessions to unlock weekly reviews, model rankings and failure analysis."
        />
      </PageContainer>
    );
  }

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const thisWeek = sessions.filter((s) => s.date >= weekStart);
  const lastWeek = sessions.filter(
    (s) => s.date >= lastWeekStart && s.date < weekStart,
  );
  const monthSessions = sessions.filter((s) => s.date >= monthStart);

  const week = summarize(thisWeek);
  const prevWeek = summarize(lastWeek);

  const biggestWins = [...thisWeek]
    .sort((a, b) => netTimeSaved(b) - netTimeSaved(a))
    .slice(0, 5);

  const monthlyModels = sortLeaderboard(
    leaderboard(monthSessions, byModel),
    "quality",
  );
  const costValueBoard = sortLeaderboard(
    leaderboard(sessions, byModel),
    "costValue",
  );
  const reliabilityBoard = sortLeaderboard(
    leaderboard(sessions, byModel),
    "reliability",
  );

  const taskTypes = [...new Set(sessions.map((s) => s.taskType))] as TaskType[];

  const bestByTask = taskTypes
    .map((tt) => {
      const subset = sessions.filter((s) => s.taskType === tt);
      const best = bestBy(leaderboard(subset, byModel), (st) => st.avgQuality, 1);
      return { taskType: tt, best, count: subset.length };
    })
    .filter((r) => r.best)
    .sort(
      (a, b) => (b.best!.stats.avgQuality ?? 0) - (a.best!.stats.avgQuality ?? 0),
    );

  const strongVsCheap = taskTypes
    .map((tt) => {
      const subset = sessions.filter((s) => s.taskType === tt);
      const strong = subset.filter((s) => strengthGroup(s) === "strong");
      const cheap = subset.filter((s) => strengthGroup(s) === "cheap");
      const strongAvg = mean(strong.map((s) => s.qualityScore));
      const cheapAvg = mean(cheap.map((s) => s.qualityScore));
      return {
        taskType: tt,
        strongAvg,
        cheapAvg,
        strongCount: strong.length,
        cheapCount: cheap.length,
        delta: strongAvg != null && cheapAvg != null ? strongAvg - cheapAvg : null,
      };
    })
    .filter((r) => r.strongCount > 0 && r.cheapCount > 0 && r.delta != null)
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0));

  const heatmap = failureHeatmap(sessions);

  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        description="Weekly reviews, rankings and where the strong models earn their cost."
      />

      <Tabs defaultValue="weekly">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="weekly">Weekly review</TabsTrigger>
          <TabsTrigger value="rankings">Model rankings</TabsTrigger>
          <TabsTrigger value="bytask">By task type</TabsTrigger>
          <TabsTrigger value="failures">Failures</TabsTrigger>
          <TabsTrigger value="flagship">Flagship worth it?</TabsTrigger>
        </TabsList>

        {/* Weekly review */}
        <TabsContent value="weekly" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Sessions this week"
              value={week.count}
              icon={TrendingUp}
              delta={prevWeek.count ? { value: pctChange(week.count, prevWeek.count) ?? 0 } : null}
              hint="vs last week"
            />
            <StatCard
              label="Net time saved"
              value={formatHours(week.netTimeSavedMinutes)}
              delta={
                prevWeek.netTimeSavedMinutes
                  ? { value: pctChange(week.netTimeSavedMinutes, prevWeek.netTimeSavedMinutes) ?? 0 }
                  : null
              }
              hint="vs last week"
            />
            <StatCard
              label="Spend"
              value={formatCurrency(week.totalCost)}
              delta={
                prevWeek.totalCost
                  ? { value: pctChange(week.totalCost, prevWeek.totalCost) ?? 0, positiveIsGood: false }
                  : null
              }
              hint="vs last week"
            />
            <StatCard
              label="Avg quality"
              value={`${formatScore(week.avgQuality)}/10`}
              delta={
                week.avgQuality && prevWeek.avgQuality
                  ? { value: pctChange(week.avgQuality, prevWeek.avgQuality) ?? 0 }
                  : null
              }
              hint="vs last week"
            />
          </div>

          <SectionCard
            title="Biggest wins this week"
            description="Sessions that saved the most net time."
            contentClassName="p-0"
          >
            {biggestWins.length === 0 ? (
              <p className="text-muted-foreground px-6 pb-6 text-sm">
                No sessions logged this week yet.
              </p>
            ) : (
              <ul className="divide-border/60 divide-y">
                {biggestWins.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/sessions/${s.id}`}
                      className="hover:bg-accent/40 flex items-center gap-3 px-6 py-3 transition-colors"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {s.title}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {s.model?.shortName ?? s.model?.name ?? "No model"}
                        </span>
                      </span>
                      <span className="text-success tabnum text-sm font-medium">
                        +{formatHours(netTimeSaved(s))}
                      </span>
                      <ScoreBadge value={s.qualityScore} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        {/* Model rankings */}
        <TabsContent value="rankings" className="flex flex-col gap-4">
          <SectionCard
            title="Monthly model ranking"
            description="This month, by average quality."
            contentClassName="p-0 pt-0"
          >
            <div className="px-4 pb-4">
              {monthlyModels.length ? (
                <StatsLeaderboard rows={monthlyModels} hrefBase="/models/" nameLabel="Model" rank />
              ) : (
                <p className="text-muted-foreground text-sm">No sessions this month.</p>
              )}
            </div>
          </SectionCard>
          <SectionCard
            title="Cost-value leaderboard"
            description="Quality per dollar across all time."
            contentClassName="p-0"
          >
            <div className="px-4 pb-4">
              <StatsLeaderboard rows={costValueBoard} hrefBase="/models/" nameLabel="Model" rank />
            </div>
          </SectionCard>
          <SectionCard
            title="Reliability leaderboard"
            description="By reliability index across all time."
            contentClassName="p-0"
          >
            <div className="px-4 pb-4">
              <StatsLeaderboard rows={reliabilityBoard} hrefBase="/models/" nameLabel="Model" rank />
            </div>
          </SectionCard>
        </TabsContent>

        {/* By task type */}
        <TabsContent value="bytask">
          <SectionCard
            title="Best model by task type"
            description="The highest-quality model for each kind of work."
            contentClassName="p-0"
          >
            <div className="scrollbar-thin overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Task type</TableHead>
                    <TableHead>Best model</TableHead>
                    <TableHead className="text-center">Quality</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bestByTask.map((r) => (
                    <TableRow key={r.taskType}>
                      <TableCell className="font-medium">
                        {taskTypeLabels[r.taskType]}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/models/${r.best!.id}`}
                          className="hover:text-primary"
                        >
                          {r.best!.label}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                        <ScoreBadge value={r.best!.stats.avgQuality} />
                      </TableCell>
                      <TableCell className="tabnum text-right text-sm">
                        {r.best!.stats.count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Failures */}
        <TabsContent value="failures">
          <SectionCard
            title="Failure pattern heatmap"
            description="Where failures concentrate — failure type × task type."
          >
            <FailureHeatmap
              rows={heatmap.rows}
              cols={heatmap.cols}
              matrix={heatmap.matrix}
            />
          </SectionCard>
        </TabsContent>

        {/* Flagship worth it */}
        <TabsContent value="flagship">
          <SectionCard
            title="Is the strong model worth it?"
            description="Average quality of flagship / reasoning / coding models vs small / medium ones, per task type — only where both were used."
            contentClassName="p-0"
          >
            {strongVsCheap.length === 0 ? (
              <p className="text-muted-foreground px-6 pb-6 text-sm">
                Not enough overlapping data yet. Log the same task type with both a
                strong and a cheaper model to compare.
              </p>
            ) : (
              <div className="scrollbar-thin overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Task type</TableHead>
                      <TableHead className="text-center">Strong avg</TableHead>
                      <TableHead className="text-center">Cheaper avg</TableHead>
                      <TableHead className="text-center">Δ</TableHead>
                      <TableHead>Verdict</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strongVsCheap.map((r) => {
                      const verdict = worthItVerdict(r.delta!);
                      return (
                        <TableRow key={r.taskType}>
                          <TableCell className="font-medium">
                            {taskTypeLabels[r.taskType]}
                          </TableCell>
                          <TableCell className="tabnum text-center text-sm">
                            {formatScore(r.strongAvg)}{" "}
                            <span className="text-muted-foreground text-xs">
                              ({r.strongCount})
                            </span>
                          </TableCell>
                          <TableCell className="tabnum text-center text-sm">
                            {formatScore(r.cheapAvg)}{" "}
                            <span className="text-muted-foreground text-xs">
                              ({r.cheapCount})
                            </span>
                          </TableCell>
                          <TableCell className="tabnum text-center text-sm font-medium">
                            {r.delta! > 0 ? "+" : ""}
                            {formatScore(r.delta)}
                          </TableCell>
                          <TableCell>
                            <ToneBadge tone={verdict.tone}>
                              {verdict.label}
                            </ToneBadge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
