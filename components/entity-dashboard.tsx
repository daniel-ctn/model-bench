import { NotebookPen, ShieldAlert, TrendingDown, Trophy } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/section-card";
import { SessionsTable } from "@/components/tables/sessions-table";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreBadge } from "@/components/badges";
import { failureTypeLabels, taskTypeLabels } from "@/lib/constants";
import {
  formatMinutes,
  formatPercent,
  formatScore,
} from "@/lib/format";
import {
  byTaskType,
  computeStats,
  failureTypeCounts,
  leaderboard,
  type LeaderboardRow,
} from "@/lib/metrics";
import type { SessionWithRelations, TaskType } from "@/types";

function Tile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow text-muted-foreground">{label}</p>
      <p className="font-heading tabnum mt-1.5 text-lg font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function TaskList({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-2 text-sm">
          <span className="flex-1 truncate">
            {taskTypeLabels[r.id as TaskType] ?? r.label}
          </span>
          <span className="text-muted-foreground tabnum text-xs">
            {r.stats.count}×
          </span>
          <ScoreBadge value={r.stats.avgQuality} />
        </li>
      ))}
    </ul>
  );
}

export function EntityDashboard({
  sessions,
  emptyHint,
}: {
  sessions: SessionWithRelations[];
  emptyHint?: string;
}) {
  if (!sessions.length) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="No sessions yet"
        description={emptyHint ?? "Log sessions to populate analytics here."}
      />
    );
  }

  const stats = computeStats(sessions);
  const taskBoard = leaderboard(sessions, byTaskType).filter(
    (r) => r.stats.avgQuality != null,
  );
  const byQuality = [...taskBoard].sort(
    (a, b) => (b.stats.avgQuality ?? 0) - (a.stats.avgQuality ?? 0),
  );
  const best = byQuality.slice(0, 4);
  const worst = byQuality.length > 4 ? byQuality.slice(-3).reverse() : [];
  const failures = failureTypeCounts(sessions, (t) => failureTypeLabels[t]).slice(
    0,
    6,
  );
  const maxFailure = failures[0]?.value ?? 1;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 lg:grid-cols-6">
          <Tile label="Sessions" value={stats.count} />
          <Tile label="Avg quality" value={`${formatScore(stats.avgQuality)}/10`} />
          <Tile label="Reliability" value={formatScore(stats.avgReliability)} />
          <Tile
            label="Cost-value"
            value={stats.avgCostValue == null ? "—" : formatScore(stats.avgCostValue)}
          />
          <Tile
            label="Net saved"
            value={formatMinutes(stats.netTimeSavedMinutes)}
          />
          <Tile label="Success rate" value={formatPercent(stats.successRate)} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          eyebrow="Strengths"
          icon={Trophy}
          title="Best task types"
          description="Where it shines — highest average quality."
        >
          {best.length ? (
            <TaskList rows={best} />
          ) : (
            <p className="text-muted-foreground text-sm">Not enough data.</p>
          )}
        </SectionCard>
        {worst.length ? (
          <SectionCard
            eyebrow="Weak spots"
            icon={TrendingDown}
            title="Weakest task types"
            description="Where it struggles — lowest average quality."
          >
            <TaskList rows={worst} />
          </SectionCard>
        ) : (
          <SectionCard
            eyebrow="Failures"
            icon={ShieldAlert}
            title="Common failure patterns"
            description="Most frequent failure modes."
          >
            {failures.length ? (
              <FailureBars failures={failures} max={maxFailure} />
            ) : (
              <p className="text-muted-foreground text-sm">
                No failure patterns logged.
              </p>
            )}
          </SectionCard>
        )}
      </div>

      {worst.length ? (
        <SectionCard
          eyebrow="Failures"
          icon={ShieldAlert}
          title="Common failure patterns"
          description="Most frequent failure modes."
        >
          {failures.length ? (
            <FailureBars failures={failures} max={maxFailure} />
          ) : (
            <p className="text-muted-foreground text-sm">
              No failure patterns logged.
            </p>
          )}
        </SectionCard>
      ) : null}

      <div>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="font-heading text-sm font-semibold tracking-tight">
            Session history
          </h2>
          <span className="text-muted-foreground tabnum text-xs">
            {sessions.length}
          </span>
        </div>
        <SessionsTable sessions={sessions} />
      </div>
    </div>
  );
}

function FailureBars({
  failures,
  max,
}: {
  failures: { label: string; value: number }[];
  max: number;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {failures.map((f) => (
        <li key={f.label} className="flex items-center gap-3 text-sm">
          <span className="w-40 shrink-0 truncate">{f.label}</span>
          <span className="bg-muted relative h-2 flex-1 overflow-hidden rounded-full">
            <span
              className="bg-destructive/70 absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${(f.value / max) * 100}%` }}
            />
          </span>
          <span className="text-muted-foreground tabnum w-6 text-right text-xs">
            {f.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
