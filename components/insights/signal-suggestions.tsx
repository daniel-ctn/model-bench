"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Check,
  DollarSign,
  Plus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { ToneBadge } from "@/components/tone-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createInsightFromSignal } from "@/app/insights/actions";
import type { Signal, SignalKind } from "@/lib/metrics/signals";

const KIND_ICON: Record<SignalKind, typeof TrendingDown> = {
  regression: TrendingDown,
  improvement: TrendingUp,
  "reliable-pick": ShieldCheck,
  "low-value-spend": DollarSign,
  "recurring-failure": AlertTriangle,
  "weak-task": AlertTriangle,
};

const KIND_LABEL: Record<SignalKind, string> = {
  regression: "Regression",
  improvement: "Improving",
  "reliable-pick": "Reliable pick",
  "low-value-spend": "Spend watch",
  "recurring-failure": "Recurring failure",
  "weak-task": "Weak task",
};

export function SignalSuggestions({ signals }: { signals: Signal[] }) {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);

  const visible = signals.filter((s) => !saved.has(s.id));
  if (!visible.length) return null;

  const save = (signal: Signal) => {
    setSavingId(signal.id);
    startTransition(async () => {
      const res = await createInsightFromSignal({
        title: signal.title,
        description: signal.detail,
        relatedModelId:
          signal.entity?.kind === "model" ? signal.entity.id : null,
        relatedToolId: signal.entity?.kind === "tool" ? signal.entity.id : null,
        confidence: signal.confidence,
      });
      setSavingId(null);
      if (res.ok) {
        setSaved((prev) => new Set(prev).add(signal.id));
        toast.success("Saved as insight.");
      } else {
        toast.error(res.error ?? "Could not save insight.");
      }
    });
  };

  return (
    <section className="mb-6">
      <h2 className="mb-1 text-sm font-semibold">Suggested by your data</h2>
      <p className="text-muted-foreground mb-3 text-sm">
        Patterns ModelBench spotted in your sessions. Save the ones worth keeping.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((signal) => {
          const Icon = KIND_ICON[signal.kind];
          return (
            <Card key={signal.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-2.5 p-4">
                <div className="flex items-center gap-2">
                  <ToneBadge tone={signal.tone}>
                    <Icon className="size-3" />
                    {KIND_LABEL[signal.kind]}
                  </ToneBadge>
                </div>
                <h3 className="text-sm leading-snug font-medium">
                  {signal.title}
                </h3>
                <p className="text-muted-foreground flex-1 text-xs leading-relaxed">
                  {signal.detail}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  disabled={pending && savingId === signal.id}
                  onClick={() => save(signal)}
                >
                  {pending && savingId === signal.id ? (
                    <Check />
                  ) : (
                    <Plus />
                  )}
                  Save as insight
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
