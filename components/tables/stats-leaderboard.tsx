import Link from "next/link";

import { ScoreBadge } from "@/components/badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMinutes, formatPercent, formatScore } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/metrics";
import { cn } from "@/lib/utils";

export function StatsLeaderboard({
  rows,
  hrefBase,
  nameLabel = "Name",
  rank = false,
}: {
  rows: LeaderboardRow[];
  hrefBase?: string;
  nameLabel?: string;
  rank?: boolean;
}) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {rank ? <TableHead className="w-8">#</TableHead> : null}
            <TableHead className="min-w-[160px]">{nameLabel}</TableHead>
            <TableHead className="text-right">Sessions</TableHead>
            <TableHead className="text-center">Quality</TableHead>
            <TableHead className="text-right">Reliability</TableHead>
            <TableHead className="text-right">Cost-value</TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              Net saved
            </TableHead>
            <TableHead className="hidden text-right md:table-cell">
              Success
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={r.id}>
              {rank ? (
                <TableCell className="text-muted-foreground tabnum">
                  {i + 1}
                </TableCell>
              ) : null}
              <TableCell className="font-medium">
                {hrefBase ? (
                  <Link
                    href={`${hrefBase}${r.id}`}
                    className="hover:text-primary"
                  >
                    {r.label}
                  </Link>
                ) : (
                  r.label
                )}
              </TableCell>
              <TableCell className="tabnum text-right">
                {r.stats.count}
              </TableCell>
              <TableCell className="text-center">
                <ScoreBadge value={r.stats.avgQuality} />
              </TableCell>
              <TableCell className="tabnum text-right">
                {formatScore(r.stats.avgReliability)}
              </TableCell>
              <TableCell className="tabnum text-right">
                {r.stats.avgCostValue == null
                  ? "—"
                  : formatScore(r.stats.avgCostValue)}
              </TableCell>
              <TableCell
                className={cn(
                  "tabnum hidden text-right sm:table-cell",
                  r.stats.netTimeSavedMinutes > 0
                    ? "text-success"
                    : r.stats.netTimeSavedMinutes < 0
                      ? "text-destructive"
                      : "",
                )}
              >
                {formatMinutes(r.stats.netTimeSavedMinutes)}
              </TableCell>
              <TableCell className="tabnum hidden text-right md:table-cell">
                {formatPercent(r.stats.successRate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
