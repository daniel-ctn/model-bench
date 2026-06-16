"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { generateIngestToken } from "@/app/account/actions";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success(`${label} copied.`);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="text-success" /> : <Copy />}
    </Button>
  );
}

export function IngestTokenCard({
  initialToken,
  endpoint,
}: {
  initialToken: string | null;
  endpoint: string;
}) {
  const [token, setToken] = useState(initialToken);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const regenerate = () => {
    startTransition(async () => {
      const res = await generateIngestToken();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setToken(res.data.token);
      toast.success("Ingest token generated.");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Let an agent log sessions for you: have it{" "}
        <code className="text-foreground">POST</code> a session draft to the
        endpoint below using this token. Drafts appear in Sessions for you to
        review and confirm.
      </p>

      <div className="space-y-1.5">
        <p className="text-muted-foreground text-xs font-medium">Endpoint</p>
        <div className="bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2">
          <code className="flex-1 truncate text-sm">POST {endpoint}</code>
          <CopyButton value={endpoint} label="Endpoint" />
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-muted-foreground text-xs font-medium">
          Token{" "}
          <span className="text-muted-foreground/70">
            (sent as Authorization: Bearer …)
          </span>
        </p>
        {token ? (
          <div className="bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2">
            <code className="flex-1 truncate text-sm">{token}</code>
            <CopyButton value={token} label="Token" />
          </div>
        ) : (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <KeyRound className="size-4" />
            No token yet — generate one to enable ingestion.
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={regenerate}
        disabled={pending}
      >
        {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        {token ? "Regenerate token" : "Generate token"}
      </Button>

      {token ? (
        <details className="text-sm">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs">
            Show example request
          </summary>
          <pre className="scrollbar-thin bg-muted/40 mt-2 overflow-x-auto rounded-lg border p-3 text-xs">
            {`curl -X POST ${endpoint} \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Refactor checkout into server actions",
    "tool": "Claude Code",
    "model": "Opus 4.8",
    "project": "SmartTrips",
    "taskType": "refactor",
    "workflowType": "agent-autonomous",
    "resultStatus": "good",
    "timeSpentMinutes": 35,
    "estimatedTimeSavedMinutes": 150,
    "estimatedCostUsd": 0.9,
    "qualityScore": 8,
    "whatWorked": "Clean multi-file edits, tests passed",
    "tags": ["rsc", "refactor"]
  }'`}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
