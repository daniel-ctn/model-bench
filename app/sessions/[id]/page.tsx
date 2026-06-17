import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CircleCheck,
  CircleX,
  Lightbulb,
  Pencil,
  Sparkles,
} from "lucide-react";

import {
  InterventionBadge,
  QuotaBadge,
  ResultStatusBadge,
  ScoreBadge,
  SeverityBadge,
  WorthItBadge,
} from "@/components/badges";
import { ScoreRadar } from "@/components/charts/score-radar";
import { ConfirmSessionButton } from "@/components/sessions/confirm-session-button";
import { DeleteAction } from "@/components/delete-action";
import { PageContainer } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { TagList } from "@/components/tag-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteSession } from "@/app/sessions/actions";
import { getSessionById } from "@/db/queries";
import {
  failureTypeLabels,
  taskTypeLabels,
  workflowTypeLabels,
} from "@/lib/constants";
import {
  formatCurrency,
  formatDate,
  formatMinutes,
  formatRelative,
  formatScore,
  formatTokens,
} from "@/lib/format";
import {
  costValueIndex,
  netTimeSaved,
  reliabilityIndex,
  scoreBreakdown,
  worthItVerdict,
} from "@/lib/metrics";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Metric({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="bg-muted/30 rounded-lg border px-3 py-2.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={cn("tabnum mt-0.5 text-sm font-semibold", className)}>
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

function Prose({ title, text }: { title: string; text: string | null }) {
  if (!text) return null;
  return (
    <div>
      <h3 className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
        {title}
      </h3>
      <p className="text-sm whitespace-pre-wrap">{text}</p>
    </div>
  );
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await getSessionById(id);
  if (!s) notFound();

  const net = netTimeSaved(s);
  const cvi = costValueIndex(s);
  const rel = reliabilityIndex(s);
  const verdict = worthItVerdict(s);
  const present = scoreBreakdown(s).filter(
    (b): b is { key: string; label: string; value: number } => b.value != null,
  );

  const hasReflection =
    s.whatWorked || s.whatFailed || s.doDifferently || s.notes;
  const hasSummaries = s.promptSummary || s.outputSummary || s.taskDescription;

  return (
    <PageContainer>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground -ml-2 mb-2"
        render={<Link href="/sessions" />}
      >
        <ArrowLeft />
        Sessions
      </Button>

      {s.draft ? (
        <div className="border-warning/30 bg-warning/10 mb-4 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Sparkles className="text-warning mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">AI-generated draft</p>
              <p className="text-muted-foreground text-xs">
                Review the scores and details, then confirm — or edit to save.
              </p>
            </div>
          </div>
          <ConfirmSessionButton id={s.id} />
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{s.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <ResultStatusBadge value={s.resultStatus} />
            <WorthItBadge value={verdict} />
            <span className="text-muted-foreground text-sm">
              {formatDate(s.date)} · {formatRelative(s.date)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/sessions/${s.id}/edit`} />}
          >
            <Pencil />
            Edit
          </Button>
          <DeleteAction
            entityLabel="Session"
            name={s.title}
            redirectTo="/sessions"
            action={deleteSession.bind(null, s.id)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Key metrics */}
          <Card>
            <CardContent className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
              <Metric
                label="Quality"
                value={`${s.qualityScore}/10`}
              />
              <Metric label="Reliability index" value={`${rel}/100`} />
              <Metric
                label="Net time saved"
                value={`${net > 0 ? "+" : ""}${formatMinutes(net)}`}
                className={
                  net > 0
                    ? "text-success"
                    : net < 0
                      ? "text-destructive"
                      : undefined
                }
              />
              <Metric label="Time spent" value={formatMinutes(s.timeSpentMinutes)} />
              <Metric
                label="Time saved"
                value={formatMinutes(s.estimatedTimeSavedMinutes)}
              />
              <Metric
                label="Est. cost"
                value={formatCurrency(s.estimatedCostUsd, { precise: true })}
              />
              {s.inputTokens != null || s.outputTokens != null ? (
                <Metric
                  label="Tokens (in/out)"
                  value={`${formatTokens(s.inputTokens)} / ${formatTokens(s.outputTokens)}`}
                />
              ) : null}
              <Metric
                label="Cost-value"
                value={cvi == null ? "—" : `${formatScore(cvi)} q/$`}
              />
              <Metric label="Intervention" value={
                <span className="font-normal">
                  <InterventionBadge value={s.humanInterventionLevel} />
                </span>
              } />
              <Metric label="Quota" value={
                <span className="font-normal">
                  <QuotaBadge value={s.quotaFeeling} />
                </span>
              } />
            </CardContent>
          </Card>

          {hasSummaries ? (
            <SectionCard
              title="Prompt & output"
              contentClassName="flex flex-col gap-4"
            >
              <Prose title="Prompt summary" text={s.promptSummary} />
              <Prose title="Output summary" text={s.outputSummary} />
              <Prose title="Task description" text={s.taskDescription} />
            </SectionCard>
          ) : null}

          {hasReflection ? (
            <SectionCard
              title="Reflection"
              contentClassName="flex flex-col gap-4"
            >
              {s.whatWorked ? (
                <div>
                  <h3 className="text-success mb-1 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                    <CircleCheck className="size-3.5" />
                    What worked
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">{s.whatWorked}</p>
                </div>
              ) : null}
              {s.whatFailed ? (
                <div>
                  <h3 className="text-destructive mb-1 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                    <CircleX className="size-3.5" />
                    What failed
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">{s.whatFailed}</p>
                </div>
              ) : null}
              {s.doDifferently ? (
                <div>
                  <h3 className="text-info mb-1 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                    <Lightbulb className="size-3.5" />
                    What I&apos;d do differently
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {s.doDifferently}
                  </p>
                </div>
              ) : null}
              <Prose title="Notes" text={s.notes} />
            </SectionCard>
          ) : null}

          <SectionCard
            title={`Failure patterns (${s.failurePatterns.length})`}
            contentClassName="flex flex-col gap-3"
          >
            {s.failurePatterns.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No failure patterns logged for this session.
              </p>
            ) : (
              s.failurePatterns.map((fp) => (
                <div key={fp.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {failureTypeLabels[fp.type]}
                    </span>
                    <SeverityBadge value={fp.severity} />
                  </div>
                  {fp.description ? (
                    <p className="text-muted-foreground mt-1.5 text-sm">
                      {fp.description}
                    </p>
                  ) : null}
                  {fp.possibleFix ? (
                    <p className="mt-1.5 text-sm">
                      <span className="text-muted-foreground">Fix: </span>
                      {fp.possibleFix}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <SectionCard title="Scores">
            {present.length >= 3 ? (
              <ScoreRadar data={present.map((p) => ({ label: p.label, value: p.value }))} />
            ) : null}
            <div className="flex flex-col gap-1.5">
              {present.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-muted-foreground">{p.label}</span>
                  <ScoreBadge value={p.value} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Context" contentClassName="divide-border/60 divide-y">
            <InfoRow label="Project">
              {s.project ? (
                <Link
                  href={`/projects/${s.project.id}`}
                  className="hover:text-primary"
                >
                  {s.project.name}
                </Link>
              ) : (
                "—"
              )}
            </InfoRow>
            <InfoRow label="Tool">
              {s.tool ? (
                <Link href={`/tools/${s.tool.id}`} className="hover:text-primary">
                  {s.tool.name}
                </Link>
              ) : (
                "—"
              )}
            </InfoRow>
            <InfoRow label="Model">
              {s.model ? (
                <Link
                  href={`/models/${s.model.id}`}
                  className="hover:text-primary"
                >
                  {s.model.shortName ?? s.model.name}
                </Link>
              ) : (
                "—"
              )}
            </InfoRow>
            {s.followupModel ? (
              <InfoRow label="Follow-up model">
                <Link
                  href={`/models/${s.followupModel.id}`}
                  className="hover:text-primary"
                >
                  {s.followupModel.shortName ?? s.followupModel.name}
                </Link>
              </InfoRow>
            ) : null}
            <InfoRow label="Task type">{taskTypeLabels[s.taskType]}</InfoRow>
            <InfoRow label="Workflow">
              {workflowTypeLabels[s.workflowType]}
            </InfoRow>
            <InfoRow label="Tests">
              {s.testsRun
                ? s.testsPassed === true
                  ? "Passed"
                  : s.testsPassed === false
                    ? "Failed"
                    : "Run"
                : "Not run"}
            </InfoRow>
            <InfoRow label="Regression">
              {s.causedRegression ? "Yes" : "No"}
            </InfoRow>
          </SectionCard>

          {s.tags.length > 0 ? (
            <SectionCard title="Tags">
              <TagList tags={s.tags} />
            </SectionCard>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
