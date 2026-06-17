import Link from "next/link";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import {
  ArrowRight,
  Boxes,
  ClipboardList,
  Clock,
  DollarSign,
  Gauge,
  NotebookPen,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import {
  ResultStatusBadge,
  ScoreBadge,
} from "@/components/badges";
import { CostValueScatter } from "@/components/charts/cost-value-scatter";
import { DonutChart } from "@/components/charts/donut-chart";
import { ScoreTrendChart } from "@/components/charts/score-trend-chart";
import { TimeBalanceChart } from "@/components/charts/time-balance-chart";
import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listSessions } from "@/db/queries";
import { failureTypeLabels } from "@/lib/constants";
import {
  formatCurrency,
  formatDate,
  formatHours,
  formatScore,
} from "@/lib/format";
import {
  bestBy,
  byModel,
  byTool,
  distribution,
  leaderboard,
  reliabilityIndex,
  summarize,
  topFailurePattern,
  trendByDay,
} from "@/lib/metrics";
import { computeSignals } from "@/lib/metrics/signals";
import { cn } from "@/lib/utils";
import type { SessionWithRelations, Tone } from "@/types";

export const dynamic = "force-dynamic";

const signalDotClass: Record<Tone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
  neutral: "bg-muted-foreground",
};

function pctChange(curr: number, prev: number): number | null {
  if (!prev) return null;
  return ((curr - prev) / prev) * 100;
}

export default async function DashboardPage() {
  const sessions = await listSessions();

  if (sessions.length === 0) {
    return (
      <PageContainer>
        <PageHeader
          title="Dashboard"
          description="Your AI tooling command center."
        />
        <EmptyState
          icon={Sparkles}
          title="No sessions logged yet"
          description="Log your AI coding, writing and research sessions to start measuring which models and tools actually pay off. Or seed realistic sample data to explore."
        >
          <div className="flex flex-wrap justify-center gap-2">
            <Button render={<Link href="/sessions/new" />}>
              <NotebookPen />
              Log your first session
            </Button>
            <Button variant="outline" render={<Link href="/data" />}>
              Import data
            </Button>
          </div>
        </EmptyState>
      </PageContainer>
    );
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const inRange = (s: SessionWithRelations, a: Date, b: Date) =>
    s.date >= a && s.date <= b;
  const monthSessions = sessions.filter((s) => inRange(s, monthStart, monthEnd));
  const lastMonthSessions = sessions.filter((s) =>
    inRange(s, lastMonthStart, lastMonthEnd),
  );

  const kpis = summarize(monthSessions);
  const prev = summarize(lastMonthSessions);

  // Best models (all-time, ignoring tiny samples where possible).
  const modelBoard = leaderboard(sessions, byModel);
  const bestQuality =
    bestBy(modelBoard, (s) => s.avgQuality, 2) ??
    bestBy(modelBoard, (s) => s.avgQuality, 1);
  const bestCostValue =
    bestBy(modelBoard, (s) => s.avgCostValue, 2) ??
    bestBy(modelBoard, (s) => s.avgCostValue, 1);
  const worstFailure = topFailurePattern(
    sessions,
    (t) => failureTypeLabels[t],
  );

  // Charts
  const trend = trendByDay(sessions).slice(-24);
  const trendData = trend.map((p) => ({
    date: p.date,
    label: formatDate(p.date, "MMM d"),
    quality: p.avgQuality == null ? null : Math.round(p.avgQuality * 10) / 10,
    reliability:
      p.avgReliability == null ? null : Math.round((p.avgReliability / 10) * 10) / 10,
  }));
  const timeData = trend.slice(-12).map((p) => ({
    label: formatDate(p.date, "MMM d"),
    saved: Math.round((p.totalTimeSavedMinutes / 60) * 10) / 10,
    spent: Math.round((p.totalTimeSpentMinutes / 60) * 10) / 10,
  }));
  const toolUsage = distribution(sessions, byTool).slice(0, 6);
  const scatterData = sessions
    .filter((s) => s.estimatedCostUsd != null && s.estimatedCostUsd > 0)
    .map((s) => ({
      cost: s.estimatedCostUsd as number,
      quality: s.qualityScore,
      label: s.title,
      model: s.model?.shortName ?? s.model?.name ?? "—",
    }))
    .slice(0, 80);

  // Top models this month
  const topModels = leaderboard(monthSessions, byModel)
    .sort(
      (a, b) =>
        (b.stats.avgQuality ?? 0) - (a.stats.avgQuality ?? 0) ||
        b.stats.count - a.stats.count,
    )
    .slice(0, 5);

  // Computed signals worth a glance (top few).
  const signals = computeSignals(sessions).slice(0, 5);

  // Sessions to review — lowest reliability / problematic first
  const toReview = [...sessions]
    .map((s) => ({ s, rel: reliabilityIndex(s) }))
    .filter(
      ({ s, rel }) =>
        rel < 70 ||
        s.resultStatus === "poor" ||
        s.resultStatus === "failed" ||
        s.failurePatterns.length > 0,
    )
    .sort((a, b) => a.rel - b.rel || b.s.date.getTime() - a.s.date.getTime())
    .slice(0, 5);

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={`Tracking ${sessions.length} session${sessions.length === 1 ? "" : "s"} across your AI workflow.`}
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sessions this month"
          value={kpis.count}
          icon={NotebookPen}
          delta={
            prev.count
              ? { value: pctChange(kpis.count, prev.count) ?? 0 }
              : null
          }
          hint="vs last month"
        />
        <StatCard
          label="Net time saved"
          value={formatHours(kpis.netTimeSavedMinutes)}
          icon={Clock}
          delta={
            prev.netTimeSavedMinutes
              ? {
                  value:
                    pctChange(
                      kpis.netTimeSavedMinutes,
                      prev.netTimeSavedMinutes,
                    ) ?? 0,
                }
              : null
          }
          hint="this month"
        />
        <StatCard
          label="Estimated cost"
          value={formatCurrency(kpis.totalCost)}
          icon={DollarSign}
          delta={
            prev.totalCost
              ? {
                  value: pctChange(kpis.totalCost, prev.totalCost) ?? 0,
                  positiveIsGood: false,
                }
              : null
          }
          hint="this month"
        />
        <StatCard
          label="Avg quality"
          value={
            <span>
              {formatScore(kpis.avgQuality)}
              <span className="text-muted-foreground text-base font-normal">
                /10
              </span>
            </span>
          }
          icon={Gauge}
          delta={
            prev.avgQuality && kpis.avgQuality
              ? { value: pctChange(kpis.avgQuality, prev.avgQuality) ?? 0 }
              : null
          }
          hint="this month"
        />
      </div>

      {/* Highlight row */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <HighlightCard
          icon={Boxes}
          tone="primary"
          eyebrow="Best model · quality"
          title={bestQuality?.label ?? "—"}
          metric={
            bestQuality
              ? `${formatScore(bestQuality.stats.avgQuality)}/10 avg · ${bestQuality.stats.count} sessions`
              : "Not enough data"
          }
          href={bestQuality ? `/models/${bestQuality.id}` : undefined}
        />
        <HighlightCard
          icon={Sparkles}
          tone="success"
          eyebrow="Best model · cost-value"
          title={bestCostValue?.label ?? "—"}
          metric={
            bestCostValue && bestCostValue.stats.avgCostValue != null
              ? `${formatScore(bestCostValue.stats.avgCostValue)} quality/$ · ${bestCostValue.stats.count} sessions`
              : "Add cost estimates"
          }
          href={bestCostValue ? `/models/${bestCostValue.id}` : undefined}
        />
        <HighlightCard
          icon={ShieldAlert}
          tone="danger"
          eyebrow="Worst recurring failure"
          title={worstFailure?.label ?? "None yet"}
          metric={
            worstFailure
              ? `${worstFailure.value} occurrence${worstFailure.value === 1 ? "" : "s"}`
              : "No failure patterns logged"
          }
          href="/reports"
        />
      </div>

      {/* Charts row 1 */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title="Score & reliability trend"
          description="Average quality and reliability (rescaled to /10) over recent active days."
        >
          <ScoreTrendChart data={trendData} />
        </SectionCard>
        <SectionCard title="Usage by tool" description="Share of logged sessions.">
          <DonutChart data={toolUsage} />
        </SectionCard>
      </div>

      {/* Charts row 2 */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Time saved vs time spent"
          description="Hours per recent active day."
        >
          <TimeBalanceChart data={timeData} />
        </SectionCard>
        <SectionCard
          title="Cost vs quality"
          description="Each point is a session — top-left is great value."
        >
          <CostValueScatter data={scatterData} />
        </SectionCard>
      </div>

      {/* Signals */}
      {signals.length > 0 ? (
        <div className="mt-4">
          <SectionCard
            title="Signals"
            description="Patterns ModelBench spotted in your data."
            action={
              <Button variant="ghost" size="sm" render={<Link href="/insights" />}>
                Review
                <ArrowRight />
              </Button>
            }
            contentClassName="p-0"
          >
            <ul className="divide-border/60 divide-y">
              {signals.map((sig) => {
                const href = sig.entity
                  ? `/models/${sig.entity.id}`
                  : "/recommend";
                return (
                  <li key={sig.id}>
                    <Link
                      href={href}
                      className="hover:bg-accent/40 flex items-center gap-3 px-6 py-3 transition-colors"
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 self-start rounded-full",
                          signalDotClass[sig.tone],
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {sig.title}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {sig.detail}
                        </span>
                      </span>
                      <ArrowRight className="text-muted-foreground/50 size-4 shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        </div>
      ) : null}

      {/* Lists row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Top models this month"
          description="Ranked by average quality."
          action={
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/models" />}
            >
              All models
              <ArrowRight />
            </Button>
          }
          contentClassName="p-0"
        >
          {topModels.length === 0 ? (
            <p className="text-muted-foreground px-6 pb-6 text-sm">
              No model-tagged sessions this month.
            </p>
          ) : (
            <ul className="divide-border/60 divide-y">
              {topModels.map((row, i) => (
                <li key={row.id}>
                  <Link
                    href={`/models/${row.id}`}
                    className="hover:bg-accent/40 flex items-center gap-3 px-6 py-3 transition-colors"
                  >
                    <span className="text-muted-foreground tabnum w-4 text-sm font-medium">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {row.label}
                    </span>
                    <span className="text-muted-foreground tabnum text-xs">
                      {row.stats.count}×
                    </span>
                    <ScoreBadge value={row.stats.avgQuality} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Sessions to review"
          description="Lowest reliability or flagged with failures."
          action={
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/sessions" />}
            >
              All sessions
              <ArrowRight />
            </Button>
          }
          contentClassName="p-0"
        >
          {toReview.length === 0 ? (
            <div className="px-6 pb-6">
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <ClipboardList className="size-4" />
                Nothing flagged — your sessions look healthy.
              </p>
            </div>
          ) : (
            <ul className="divide-border/60 divide-y">
              {toReview.map(({ s, rel }) => (
                <li key={s.id}>
                  <Link
                    href={`/sessions/${s.id}`}
                    className="hover:bg-accent/40 flex items-center gap-3 px-6 py-3 transition-colors"
                  >
                    <TriangleAlert className="text-warning/80 size-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {s.title}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatDate(s.date)} ·{" "}
                        {s.model?.shortName ?? s.model?.name ?? "No model"}
                      </span>
                    </span>
                    <span className="text-muted-foreground tabnum hidden text-xs sm:inline">
                      {rel} rel.
                    </span>
                    <ResultStatusBadge value={s.resultStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </PageContainer>
  );
}

function HighlightCard({
  icon: Icon,
  eyebrow,
  title,
  metric,
  href,
  tone,
}: {
  icon: typeof Boxes;
  eyebrow: string;
  title: string;
  metric: string;
  href?: string;
  tone: "primary" | "success" | "danger";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    danger: "bg-destructive/10 text-destructive",
  } as const;

  const inner = (
    <CardContent className="flex items-center gap-4 p-5">
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          toneClasses[tone],
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {eyebrow}
        </p>
        <p className="truncate text-lg font-semibold tracking-tight">{title}</p>
        <p className="text-muted-foreground truncate text-xs">{metric}</p>
      </div>
      {href ? (
        <ArrowRight className="text-muted-foreground/50 size-4 shrink-0" />
      ) : null}
    </CardContent>
  );

  if (href) {
    return (
      <Card className="hover:border-border/80 gap-0 py-0 transition-colors">
        <Link href={href}>{inner}</Link>
      </Card>
    );
  }
  return <Card className="gap-0 py-0">{inner}</Card>;
}
