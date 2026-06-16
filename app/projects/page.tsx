import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";

import { ProjectStatusBadge, ScoreBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
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
import { deleteProject } from "@/app/projects/actions";
import { listProjects, listSessions } from "@/db/queries";
import { projectTypeLabels } from "@/lib/constants";
import { formatHours } from "@/lib/format";
import { byProject, leaderboard } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const [projects, sessions] = await Promise.all([
    listProjects(),
    listSessions(),
  ]);
  const statsById = new Map(
    leaderboard(sessions, byProject).map((r) => [r.id, r.stats]),
  );

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description="Where your AI work lands — and how much it helped each one."
      >
        <Button render={<Link href="/projects/new" />}>
          <Plus />
          New project
        </Button>
      </PageHeader>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create projects to attribute sessions and see per-project AI impact."
        >
          <Button render={<Link href="/projects/new" />}>
            <Plus />
            Create a project
          </Button>
        </EmptyState>
      ) : (
        <div className="scrollbar-thin overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[200px]">Project</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-center">Quality</TableHead>
                <TableHead className="hidden sm:table-cell text-right">
                  Hours saved
                </TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => {
                const stats = statsById.get(p.id);
                return (
                  <TableRow key={p.id} className="group">
                    <TableCell>
                      <Link
                        href={`/projects/${p.id}`}
                        className="group-hover:text-primary flex items-center gap-2 font-medium transition-colors"
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                      {projectTypeLabels[p.type]}
                    </TableCell>
                    <TableCell>
                      <ProjectStatusBadge value={p.status} />
                    </TableCell>
                    <TableCell className="tabnum text-right text-sm">
                      {stats?.count ?? 0}
                    </TableCell>
                    <TableCell className="text-center">
                      <ScoreBadge value={stats?.avgQuality ?? null} />
                    </TableCell>
                    <TableCell className="tabnum hidden text-right text-sm sm:table-cell">
                      {stats ? formatHours(stats.netTimeSavedMinutes) : "—"}
                    </TableCell>
                    <TableCell className="pr-2">
                      <RowActions
                        entityLabel="Project"
                        name={p.name}
                        editHref={`/projects/${p.id}/edit`}
                        onDelete={deleteProject.bind(null, p.id)}
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
