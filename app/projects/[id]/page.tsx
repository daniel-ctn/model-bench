import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Boxes, Clock, Pencil, Wrench } from "lucide-react";

import { ProjectStatusBadge } from "@/components/badges";
import { EntityDashboard } from "@/components/entity-dashboard";
import { DeleteAction } from "@/components/delete-action";
import { PageContainer } from "@/components/layout/page-header";
import { ToneBadge } from "@/components/tone-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteProject } from "@/app/projects/actions";
import { getProjectById, listSessions } from "@/db/queries";
import { projectTypeLabels } from "@/lib/constants";
import { formatHours, formatScore } from "@/lib/format";
import { bestBy, byModel, byTool, computeStats, leaderboard } from "@/lib/metrics";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Highlight({
  icon: Icon,
  label,
  title,
  sub,
  tone,
}: {
  icon: typeof Boxes;
  label: string;
  title: string;
  sub: string;
  tone: "primary" | "success" | "info";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
  } as const;
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            toneClasses[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="truncate text-base font-semibold">{title}</p>
          <p className="text-muted-foreground truncate text-xs">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();
  const sessions = await listSessions({ projectId: id });

  const stats = computeStats(sessions);
  const topModel = bestBy(leaderboard(sessions, byModel), (s) => s.avgQuality, 1);
  const topTool = bestBy(leaderboard(sessions, byTool), (s) => s.avgQuality, 1);

  return (
    <PageContainer>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground -ml-2 mb-2"
        render={<Link href="/projects" />}
      >
        <ArrowLeft />
        Projects
      </Button>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
            <span
              className="size-3.5 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            {project.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <ToneBadge tone="neutral">
              {projectTypeLabels[project.type]}
            </ToneBadge>
            <ProjectStatusBadge value={project.status} />
          </div>
          {project.description ? (
            <p className="text-muted-foreground max-w-2xl text-sm">
              {project.description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/projects/${project.id}/edit`} />}
          >
            <Pencil />
            Edit
          </Button>
          <DeleteAction
            entityLabel="Project"
            name={project.name}
            redirectTo="/projects"
            action={deleteProject.bind(null, project.id)}
          />
        </div>
      </div>

      {sessions.length > 0 ? (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Highlight
            icon={Boxes}
            tone="primary"
            label="Most valuable model"
            title={topModel?.label ?? "—"}
            sub={
              topModel
                ? `${formatScore(topModel.stats.avgQuality)}/10 · ${topModel.stats.count} sessions`
                : "No model-tagged sessions"
            }
          />
          <Highlight
            icon={Wrench}
            tone="info"
            label="Most valuable tool"
            title={topTool?.label ?? "—"}
            sub={
              topTool
                ? `${formatScore(topTool.stats.avgQuality)}/10 · ${topTool.stats.count} sessions`
                : "No tool-tagged sessions"
            }
          />
          <Highlight
            icon={Clock}
            tone="success"
            label="Net time saved"
            title={formatHours(stats.netTimeSavedMinutes)}
            sub={`across ${stats.count} sessions`}
          />
        </div>
      ) : null}

      <EntityDashboard
        sessions={sessions}
        emptyHint="No sessions logged for this project yet."
      />
    </PageContainer>
  );
}
