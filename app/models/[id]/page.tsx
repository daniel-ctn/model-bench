import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { ModelStrengthBadge } from "@/components/badges";
import { EntityDashboard } from "@/components/entity-dashboard";
import { DeleteAction } from "@/components/delete-action";
import { PageContainer } from "@/components/layout/page-header";
import { ToneBadge } from "@/components/tone-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteModel } from "@/app/models/actions";
import { getModelById, listSessions } from "@/db/queries";
import { modelProviderLabels } from "@/lib/constants";
import { formatCurrency, formatTokens } from "@/lib/format";

export const dynamic = "force-dynamic";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-muted/30 rounded-lg border px-3 py-2.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="tabnum mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const model = await getModelById(id);
  if (!model) notFound();
  const sessions = await listSessions({ modelId: id });

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

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{model.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <ToneBadge tone="neutral">
              {modelProviderLabels[model.provider]}
            </ToneBadge>
            <ModelStrengthBadge value={model.strengthLevel} />
            {model.modelFamily ? (
              <span className="text-muted-foreground text-sm">
                {model.modelFamily} family
              </span>
            ) : null}
            {!model.active ? (
              <ToneBadge tone="warning">Inactive</ToneBadge>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/models/${model.id}/edit`} />}
          >
            <Pencil />
            Edit
          </Button>
          <DeleteAction
            entityLabel="Model"
            name={model.name}
            redirectTo="/models"
            action={deleteModel.bind(null, model.id)}
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Meta
          label="Input price"
          value={
            model.pricingInputPerMTok == null
              ? "—"
              : `${formatCurrency(model.pricingInputPerMTok)}/Mtok`
          }
        />
        <Meta
          label="Output price"
          value={
            model.pricingOutputPerMTok == null
              ? "—"
              : `${formatCurrency(model.pricingOutputPerMTok)}/Mtok`
          }
        />
        <Meta label="Context" value={formatTokens(model.contextWindow)} />
        <Meta label="Knowledge cutoff" value={model.knowledgeCutoff ?? "—"} />
      </div>

      {model.notes ? (
        <Card className="mb-4">
          <CardContent className="p-5 text-sm whitespace-pre-wrap">
            {model.notes}
          </CardContent>
        </Card>
      ) : null}

      <EntityDashboard
        sessions={sessions}
        emptyHint="No sessions logged with this model yet."
      />
    </PageContainer>
  );
}
