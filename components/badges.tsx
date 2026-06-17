import { ToneBadge } from "@/components/tone-badge";
import {
  confidenceLabels,
  confidenceTone,
  insightStatusLabels,
  insightStatusTone,
  interventionLabels,
  interventionTone,
  modelStrengthLabels,
  modelStrengthTone,
  projectStatusLabels,
  projectStatusTone,
  quotaFeelingLabels,
  quotaFeelingTone,
  resultStatusLabels,
  resultStatusTone,
  severityLabels,
  severityTone,
} from "@/lib/constants";
import { worthItLabels, worthItTone, type WorthItVerdict } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import type {
  ConfidenceLevel,
  InsightStatus,
  InterventionLevel,
  ModelStrength,
  ProjectStatus,
  QuotaFeeling,
  ResultStatus,
  Severity,
  Tone,
} from "@/types";

export function ResultStatusBadge({ value }: { value: ResultStatus }) {
  return (
    <ToneBadge tone={resultStatusTone[value]} dot>
      {resultStatusLabels[value]}
    </ToneBadge>
  );
}

export function SeverityBadge({ value }: { value: Severity }) {
  return <ToneBadge tone={severityTone[value]}>{severityLabels[value]}</ToneBadge>;
}

export function WorthItBadge({ value }: { value: WorthItVerdict }) {
  return (
    <ToneBadge tone={worthItTone[value]} dot>
      {worthItLabels[value]}
    </ToneBadge>
  );
}

export function QuotaBadge({ value }: { value: QuotaFeeling }) {
  return (
    <ToneBadge tone={quotaFeelingTone[value]}>
      {quotaFeelingLabels[value]}
    </ToneBadge>
  );
}

export function InterventionBadge({ value }: { value: InterventionLevel }) {
  return (
    <ToneBadge tone={interventionTone[value]}>
      {interventionLabels[value]}
    </ToneBadge>
  );
}

export function ProjectStatusBadge({ value }: { value: ProjectStatus }) {
  return (
    <ToneBadge tone={projectStatusTone[value]} dot>
      {projectStatusLabels[value]}
    </ToneBadge>
  );
}

export function ModelStrengthBadge({ value }: { value: ModelStrength }) {
  return (
    <ToneBadge tone={modelStrengthTone[value]}>
      {modelStrengthLabels[value]}
    </ToneBadge>
  );
}

export function ConfidenceBadge({ value }: { value: ConfidenceLevel }) {
  return (
    <ToneBadge tone={confidenceTone[value]}>{confidenceLabels[value]}</ToneBadge>
  );
}

const confidenceDotColor: Record<ConfidenceLevel, string> = {
  low: "bg-muted-foreground/50",
  medium: "bg-info",
  high: "bg-success",
};

/**
 * A tiny dot signalling how much to trust a group's averages, based on its
 * sample size. Carries an accessible title with the reason.
 */
export function ConfidenceDot({
  value,
  count,
  className,
}: {
  value: ConfidenceLevel;
  count?: number;
  className?: string;
}) {
  const title =
    count == null
      ? `${confidenceLabels[value]} confidence`
      : `${confidenceLabels[value]} confidence · ${count} session${count === 1 ? "" : "s"}`;
  return (
    <span
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-full",
        confidenceDotColor[value],
        className,
      )}
      title={title}
      aria-label={title}
    />
  );
}

export function InsightStatusBadge({ value }: { value: InsightStatus }) {
  return (
    <ToneBadge tone={insightStatusTone[value]} dot>
      {insightStatusLabels[value]}
    </ToneBadge>
  );
}

function scoreTone(value: number): Tone {
  if (value >= 8) return "success";
  if (value >= 6) return "info";
  if (value >= 4) return "warning";
  return "danger";
}

/** A compact coloured score chip (1–10). */
export function ScoreBadge({
  value,
  className,
}: {
  value: number | null | undefined;
  className?: string;
}) {
  if (value == null) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  return (
    <ToneBadge tone={scoreTone(value)} className={cn("tabnum", className)}>
      {value.toFixed(2)}
    </ToneBadge>
  );
}
