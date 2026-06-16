import { notFound } from "next/navigation";

import { InsightForm } from "@/components/forms/insight-form";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { getFormLookups, getInsightById } from "@/db/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit insight" };

export default async function EditInsightPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [insight, lookups] = await Promise.all([
    getInsightById(id),
    getFormLookups(),
  ]);
  if (!insight) notFound();

  return (
    <PageContainer>
      <PageHeader title="Edit insight" description={insight.title} />
      <InsightForm
        lookups={lookups}
        mode="edit"
        insightId={id}
        initialValues={{
          title: insight.title,
          description: insight.description ?? "",
          relatedToolId: insight.relatedToolId ?? "none",
          relatedModelId: insight.relatedModelId ?? "none",
          relatedProjectId: insight.relatedProjectId ?? "none",
          confidence: insight.confidence,
          status: insight.status,
        }}
      />
    </PageContainer>
  );
}
