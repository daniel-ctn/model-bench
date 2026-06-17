import Link from "next/link";
import { Boxes, GitCompareArrows, Plus } from "lucide-react";

import { ModelStrengthBadge, ScoreBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { ImportCatalogButton } from "@/components/models/import-catalog-button";
import { RowActions } from "@/components/tables/row-actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteModel } from "@/app/models/actions";
import { listModels, listSessions } from "@/db/queries";
import { modelProviderLabels } from "@/lib/constants";
import { formatCurrency, formatScore, formatTokens } from "@/lib/format";
import { byModel, leaderboard } from "@/lib/metrics";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Models" };

export default async function ModelsPage() {
  const [models, sessions] = await Promise.all([listModels(), listSessions()]);
  const statsById = new Map(
    leaderboard(sessions, byModel).map((r) => [r.id, r.stats]),
  );

  return (
    <PageContainer>
      <PageHeader
        title="Models"
        description="Every model you track, with the value it delivers."
      >
        <Button variant="outline" render={<Link href="/models/compare" />}>
          <GitCompareArrows />
          Compare
        </Button>
        <ImportCatalogButton />
        <Button render={<Link href="/models/new" />}>
          <Plus />
          New model
        </Button>
      </PageHeader>

      {models.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No models yet"
          description="Add the models you use so sessions can be attributed and compared. Import the current catalog to get started fast."
        >
          <div className="flex flex-wrap justify-center gap-2">
            <ImportCatalogButton />
            <Button variant="outline" render={<Link href="/models/new" />}>
              <Plus />
              Add manually
            </Button>
          </div>
        </EmptyState>
      ) : (
        <div className="scrollbar-thin overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[200px]">Model</TableHead>
                <TableHead className="hidden md:table-cell">Strength</TableHead>
                <TableHead className="hidden lg:table-cell text-right">
                  Price (in/out)
                </TableHead>
                <TableHead className="hidden xl:table-cell text-right">
                  Context
                </TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-center">Quality</TableHead>
                <TableHead className="hidden sm:table-cell text-right">
                  Cost-value
                </TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((m) => {
                const stats = statsById.get(m.id);
                return (
                  <TableRow key={m.id} className="group">
                    <TableCell>
                      <Link
                        href={`/models/${m.id}`}
                        className="group-hover:text-primary block font-medium transition-colors"
                      >
                        {m.shortName ?? m.name}
                      </Link>
                      <span className="text-muted-foreground text-xs">
                        {modelProviderLabels[m.provider]}
                        {m.active ? "" : " · inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <ModelStrengthBadge value={m.strengthLevel} />
                    </TableCell>
                    <TableCell className="text-muted-foreground tabnum hidden text-right text-sm lg:table-cell">
                      {m.pricingInputPerMTok == null &&
                      m.pricingOutputPerMTok == null
                        ? "—"
                        : `${formatCurrency(m.pricingInputPerMTok)} / ${formatCurrency(m.pricingOutputPerMTok)}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabnum hidden text-right text-sm xl:table-cell">
                      {formatTokens(m.contextWindow)}
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
                      )}
                    >
                      {stats?.avgCostValue == null
                        ? "—"
                        : formatScore(stats.avgCostValue)}
                    </TableCell>
                    <TableCell className="pr-2">
                      <RowActions
                        entityLabel="Model"
                        name={m.shortName ?? m.name}
                        editHref={`/models/${m.id}/edit`}
                        onDelete={deleteModel.bind(null, m.id)}
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
