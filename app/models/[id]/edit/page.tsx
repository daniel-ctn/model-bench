import { notFound } from "next/navigation";

import { ModelForm } from "@/components/forms/model-form";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { getModelById } from "@/db/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit model" };

export default async function EditModelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const model = await getModelById(id);
  if (!model) notFound();

  return (
    <PageContainer>
      <PageHeader title="Edit model" description={model.name} />
      <ModelForm
        mode="edit"
        modelId={id}
        initialValues={{
          provider: model.provider,
          name: model.name,
          shortName: model.shortName ?? "",
          modelFamily: model.modelFamily ?? "",
          strengthLevel: model.strengthLevel,
          pricingInputPerMTok: model.pricingInputPerMTok,
          pricingOutputPerMTok: model.pricingOutputPerMTok,
          contextWindow: model.contextWindow,
          knowledgeCutoff: model.knowledgeCutoff ?? "",
          notes: model.notes ?? "",
          active: model.active,
        }}
      />
    </PageContainer>
  );
}
