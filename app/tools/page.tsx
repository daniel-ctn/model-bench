import Link from "next/link";
import { GitCompareArrows, Plus, Wrench } from "lucide-react";

import { ScoreBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { RowActions } from "@/components/tables/row-actions";
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
import { deleteTool } from "@/app/tools/actions";
import { listSessions, listTools } from "@/db/queries";
import { toolCategoryLabels } from "@/lib/constants";
import { formatMinutes } from "@/lib/format";
import { byTool, leaderboard } from "@/lib/metrics";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tools" };

export default async function ToolsPage() {
  const [tools, sessions] = await Promise.all([listTools(), listSessions()]);
  const statsById = new Map(
    leaderboard(sessions, byTool).map((r) => [r.id, r.stats]),
  );

  return (
    <PageContainer>
      <PageHeader
        title="Tools"
        description="The apps and agents you drive your models through."
      >
        <Button variant="outline" render={<Link href="/tools/compare" />}>
          <GitCompareArrows />
          Compare
        </Button>
        <Button render={<Link href="/tools/new" />}>
          <Plus />
          New tool
        </Button>
      </PageHeader>

      {tools.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No tools yet"
          description="Add the tools you use (Codex, Claude Code, Cursor…) to attribute sessions."
        >
          <Button render={<Link href="/tools/new" />}>
            <Plus />
            Add a tool
          </Button>
        </EmptyState>
      ) : (
        <div className="scrollbar-thin overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[200px]">Tool</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-center">Quality</TableHead>
                <TableHead className="hidden sm:table-cell text-right">
                  Net saved
                </TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.map((t) => {
                const stats = statsById.get(t.id);
                const net = stats?.netTimeSavedMinutes ?? 0;
                return (
                  <TableRow key={t.id} className="group">
                    <TableCell>
                      <Link
                        href={`/tools/${t.id}`}
                        className="group-hover:text-primary block font-medium transition-colors"
                      >
                        {t.name}
                      </Link>
                      {t.website ? (
                        <span className="text-muted-foreground text-xs">
                          {t.website.replace(/^https?:\/\//, "")}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <ToneBadge tone="neutral">
                        {toolCategoryLabels[t.category]}
                      </ToneBadge>
                    </TableCell>
                    <TableCell className="tabnum text-right text-sm">
                      {stats?.count ?? 0}
                    </TableCell>
                    <TableCell className="text-center">
                      <ScoreBadge value={stats?.avgQuality ?? null} />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabnum hidden text-right text-sm sm:table-cell",
                        net > 0
                          ? "text-success"
                          : net < 0
                            ? "text-destructive"
                            : "text-muted-foreground",
                      )}
                    >
                      {stats ? formatMinutes(net) : "—"}
                    </TableCell>
                    <TableCell className="pr-2">
                      <RowActions
                        entityLabel="Tool"
                        name={t.name}
                        editHref={`/tools/${t.id}/edit`}
                        onDelete={deleteTool.bind(null, t.id)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </PageContainer>
  );
}
