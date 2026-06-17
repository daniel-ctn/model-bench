import Link from "next/link";
import { Sparkles, Wand2 } from "lucide-react";

import { ConfidenceDot, ScoreBadge } from "@/components/badges";
import { RecommendControls } from "@/components/filters/recommend-controls";
import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { Card, CardContent } from "@/components/ui/card";
import { listSessions } from "@/db/queries";
import { taskTypeLabels, taskTypeOptions } from "@/lib/constants";
import {
  recommendGoalLabels,
  recommendModels,
  recommendTools,
  type Recommendation,
  type RecommendGoal,
} from "@/lib/metrics";
import type { TaskType } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Recommendations" };

const GOALS: RecommendGoal[] = ["balanced", "quality", "budget"];

function isGoal(v: string | undefined): v is RecommendGoal {
  return !!v && (GOALS as string[]).includes(v);
}

export default async function RecommendPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string; goal?: string }>;
}) {
  const { task, goal: goalParam } = await searchParams;
  const sessions = await listSessions();
  const goal: RecommendGoal = isGoal(goalParam) ? goalParam : "balanced";
  const taskType =
    task && task in taskTypeLabels ? (task as TaskType) : null;

  const scoped = taskType
    ? sessions.filter((s) => s.taskType === taskType)
    : sessions;

  const models = recommendModels(scoped, goal);
  const tools = recommendTools(scoped, goal);

  const taskOptions = [
    { value: "all", label: "All task types" },
    ...taskTypeOptions,
  ];
  const goalOptions = GOALS.map((g) => ({
    value: g,
    label: recommendGoalLabels[g],
  }));

  const scopeLabel = taskType
    ? taskTypeLabels[taskType].toLowerCase()
    : "your work overall";

  return (
    <PageContainer>
      <PageHeader
        title="Recommendations"
        description="What to reach for next time — ranked from your own logged results, weighted by how much evidence backs each pick."
      >
        <RecommendControls taskOptions={taskOptions} goalOptions={goalOptions} />
      </PageHeader>

      {sessions.length === 0 ? (
        <EmptyState
          icon={Wand2}
          title="No recommendations yet"
          description="Log a few scored sessions and this page will tell you which model and tool to reach for, per task type."
        />
      ) : models.length === 0 && tools.length === 0 ? (
        <EmptyState
          icon={Wand2}
          title="Nothing to recommend for this filter"
          description={`No model- or tool-tagged sessions for ${scopeLabel}. Try another task type, or tag your sessions with the model and tool you used.`}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {models.length ? (
            <TopPick rec={models[0]} kind="model" scopeLabel={scopeLabel} />
          ) : null}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard
              title="Best models"
              description={`Ranked for ${recommendGoalLabels[goal].toLowerCase()} on ${scopeLabel}.`}
              contentClassName="p-0"
            >
              <RecList recs={models} hrefBase="/models/" emptyHint="No model-tagged sessions here." />
            </SectionCard>
            <SectionCard
              title="Best tools"
              description={`Ranked for ${recommendGoalLabels[goal].toLowerCase()} on ${scopeLabel}.`}
              contentClassName="p-0"
            >
              <RecList recs={tools} hrefBase="/tools/" emptyHint="No tool-tagged sessions here." />
            </SectionCard>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function TopPick({
  rec,
  kind,
  scopeLabel,
}: {
  rec: Recommendation;
  kind: "model" | "tool";
  scopeLabel: string;
}) {
  return (
    <Card className="border-primary/30 bg-primary/5 gap-0 py-0">
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <span className="bg-primary/15 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl">
          <Sparkles className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Top {kind} for {scopeLabel}
          </p>
          <Link
            href={`/models/${rec.id}`}
            className="hover:text-primary block truncate text-xl font-semibold tracking-tight"
          >
            {rec.label}
          </Link>
          <p className="text-muted-foreground mt-0.5 truncate text-sm">
            {rec.reasons.join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <ScoreBadge value={rec.stats.avgQuality} />
          <div className="text-right">
            <p className="text-primary tabnum text-2xl font-bold">{rec.score}</p>
            <p className="text-muted-foreground text-[10px] tracking-wide uppercase">
              fit
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecList({
  recs,
  hrefBase,
  emptyHint,
}: {
  recs: Recommendation[];
  hrefBase: string;
  emptyHint: string;
}) {
  if (!recs.length) {
    return <p className="text-muted-foreground px-6 pb-6 text-sm">{emptyHint}</p>;
  }
  return (
    <ul className="divide-border/60 divide-y">
      {recs.map((r, i) => (
        <li key={r.id} className="px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground tabnum w-4 text-sm font-medium">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <Link
                href={`${hrefBase}${r.id}`}
                className="hover:text-primary block truncate text-sm font-medium"
              >
                {r.label}
              </Link>
              <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate text-xs">
                <ConfidenceDot value={r.confidence} count={r.stats.count} />
                {r.reasons.join(" · ")}
              </p>
            </div>
            <ScoreBadge value={r.stats.avgQuality} />
            <div className="w-16 shrink-0">
              <div className="flex items-center justify-end gap-1.5">
                <span className="bg-muted relative h-1.5 w-8 overflow-hidden rounded-full">
                  <span
                    className="bg-primary absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${Math.min(100, r.score)}%` }}
                  />
                </span>
                <span className="tabnum w-6 text-right text-xs font-semibold">
                  {r.score}
                </span>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
