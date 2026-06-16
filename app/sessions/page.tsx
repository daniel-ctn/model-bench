import Link from "next/link";
import { Plus, SearchX, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SessionsFilterBar } from "@/components/filters/sessions-filter-bar";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { SessionsTable } from "@/components/tables/sessions-table";
import { Button } from "@/components/ui/button";
import { getFormLookups, listSessions, type SessionFilters } from "@/db/queries";
import { RESULT_STATUSES, TASK_TYPES } from "@/db/schema";
import { dateFromInput } from "@/lib/normalize";
import type { ResultStatus, TaskType } from "@/types";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function buildFilters(sp: SearchParams): SessionFilters {
  const task = first(sp.task);
  const result = first(sp.result);
  const minq = first(sp.minq);
  const fail = first(sp.fail);
  const draft = first(sp.draft);
  const from = first(sp.from);
  const to = first(sp.to);

  return {
    search: first(sp.q),
    projectId: first(sp.project),
    toolId: first(sp.tool),
    modelId: first(sp.model),
    taskType: (TASK_TYPES as readonly string[]).includes(task ?? "")
      ? (task as TaskType)
      : undefined,
    resultStatus: (RESULT_STATUSES as readonly string[]).includes(result ?? "")
      ? (result as ResultStatus)
      : undefined,
    minQuality: minq ? Number(minq) : undefined,
    hasFailure: fail === "1" ? true : fail === "0" ? false : undefined,
    draftsOnly: draft === "1",
    includeDrafts: draft === "all",
    from: from ? dateFromInput(from) : undefined,
    to: to ? dateFromInput(to) : undefined,
  };
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = buildFilters(sp);
  const [sessions, lookups, drafts] = await Promise.all([
    listSessions(filters),
    getFormLookups(),
    listSessions({ draftsOnly: true }),
  ]);
  const draftCount = drafts.length;

  const hasFilters = Object.values(sp).some(Boolean);

  return (
    <PageContainer>
      <PageHeader
        title="Sessions"
        description="Every meaningful use of an AI tool or model, scored and reflected on."
      >
        <Button render={<Link href="/sessions/new" />}>
          <Plus />
          New session
        </Button>
      </PageHeader>

      {draftCount > 0 && !filters.draftsOnly ? (
        <div className="border-warning/30 bg-warning/10 mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
          <span className="flex items-center gap-2 text-sm">
            <Sparkles className="text-warning size-4" />
            {draftCount} AI draft{draftCount === 1 ? "" : "s"} awaiting review
          </span>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/sessions?draft=1" />}
          >
            Review drafts
          </Button>
        </div>
      ) : null}

      <SessionsFilterBar lookups={lookups} />

      <div className="mt-4">
        {sessions.length > 0 ? (
          <>
            <SessionsTable sessions={sessions} />
            <p className="text-muted-foreground mt-3 text-xs">
              {sessions.length} session{sessions.length === 1 ? "" : "s"}
            </p>
          </>
        ) : hasFilters ? (
          <EmptyState
            icon={SearchX}
            title="No sessions match these filters"
            description="Try widening your search or clearing some filters."
          />
        ) : (
          <EmptyState
            icon={Plus}
            title="No sessions yet"
            description="Log your first AI session to start tracking what actually works."
          >
            <Button render={<Link href="/sessions/new" />}>
              <Plus />
              New session
            </Button>
          </EmptyState>
        )}
      </div>
    </PageContainer>
  );
}
