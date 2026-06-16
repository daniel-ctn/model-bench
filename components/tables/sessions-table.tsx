import Link from "next/link";

import { ResultStatusBadge, ScoreBadge } from "@/components/badges";
import { TagList } from "@/components/tag-list";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { taskTypeLabels } from "@/lib/constants";
import { formatDate, formatMinutes } from "@/lib/format";
import { netTimeSaved } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import type { SessionWithRelations } from "@/types";

import { SessionRowActions } from "./session-row-actions";

export function SessionsTable({
  sessions,
}: {
  sessions: SessionWithRelations[];
}) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-[220px]">Session</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="hidden lg:table-cell">Task</TableHead>
            <TableHead className="hidden xl:table-cell">Tool</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Result</TableHead>
            <TableHead className="text-center">Quality</TableHead>
            <TableHead className="hidden sm:table-cell text-right">
              Net saved
            </TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((s) => {
            const net = netTimeSaved(s);
            return (
              <TableRow key={s.id} className="group">
                <TableCell className="max-w-[320px]">
                  <Link
                    href={`/sessions/${s.id}`}
                    className="group-hover:text-primary block truncate font-medium transition-colors"
                  >
                    {s.title}
                  </Link>
                  <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                    {s.project ? (
                      <span className="truncate">{s.project.name}</span>
                    ) : (
                      <span>No project</span>
                    )}
                  </div>
                  <TagList tags={s.tags} max={3} className="mt-1" />
                </TableCell>
                <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                  {formatDate(s.date)}
                </TableCell>
                <TableCell className="text-muted-foreground hidden text-sm lg:table-cell">
                  {taskTypeLabels[s.taskType]}
                </TableCell>
                <TableCell className="text-muted-foreground hidden text-sm xl:table-cell">
                  {s.tool?.name ?? "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {s.model?.shortName ?? s.model?.name ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <ResultStatusBadge value={s.resultStatus} />
                </TableCell>
                <TableCell className="text-center">
                  <ScoreBadge value={s.qualityScore} />
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
                  {net > 0 ? "+" : ""}
                  {formatMinutes(net)}
                </TableCell>
                <TableCell className="pr-2">
                  <SessionRowActions id={s.id} title={s.title} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
