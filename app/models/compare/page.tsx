import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SortSelect } from "@/components/filters/sort-select";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { StatsLeaderboard } from "@/components/tables/stats-leaderboard";
import { Button } from "@/components/ui/button";
import { listSessions } from "@/db/queries";
import { leaderboardSortOptions } from "@/lib/constants";
import {
  byModel,
  leaderboard,
  sortLeaderboard,
  type LeaderboardSortKey,
} from "@/lib/metrics";
import { GitCompareArrows } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Compare models" };

export default async function CompareModelsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const sessions = await listSessions();
  const rows = sortLeaderboard(
    leaderboard(sessions, byModel),
    (sort as LeaderboardSortKey) ?? "quality",
  );

  return (
    <PageContainer>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground -ml-2 mb-2"
        render={<Link href="/models" />}
      >
        <ArrowLeft />
        Models
      </Button>
      <PageHeader
        title="Compare models"
        description="Side-by-side value across every model with logged sessions."
      >
        <SortSelect options={leaderboardSortOptions} />
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          icon={GitCompareArrows}
          title="Nothing to compare yet"
          description="Log sessions with models attached to build the comparison."
        />
      ) : (
        <StatsLeaderboard rows={rows} hrefBase="/models/" nameLabel="Model" rank />
      )}
    </PageContainer>
  );
}
