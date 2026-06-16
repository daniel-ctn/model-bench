import Link from "next/link";
import { ArrowLeft, GitCompareArrows } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SortSelect } from "@/components/filters/sort-select";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { StatsLeaderboard } from "@/components/tables/stats-leaderboard";
import { Button } from "@/components/ui/button";
import { listSessions } from "@/db/queries";
import { leaderboardSortOptions } from "@/lib/constants";
import {
  byTool,
  leaderboard,
  sortLeaderboard,
  type LeaderboardSortKey,
} from "@/lib/metrics";

export const dynamic = "force-dynamic";

export const metadata = { title: "Compare tools" };

export default async function CompareToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const sessions = await listSessions();
  const rows = sortLeaderboard(
    leaderboard(sessions, byTool),
    (sort as LeaderboardSortKey) ?? "quality",
  );

  return (
    <PageContainer>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground -ml-2 mb-2"
        render={<Link href="/tools" />}
      >
        <ArrowLeft />
        Tools
      </Button>
      <PageHeader
        title="Compare tools"
        description="Which workflow tool delivers the most value."
      >
        <SortSelect options={leaderboardSortOptions} />
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          icon={GitCompareArrows}
          title="Nothing to compare yet"
          description="Log sessions with tools attached to build the comparison."
        />
      ) : (
        <StatsLeaderboard rows={rows} hrefBase="/tools/" nameLabel="Tool" rank />
      )}
    </PageContainer>
  );
}
