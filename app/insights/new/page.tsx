import { InsightForm } from "@/components/forms/insight-form";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { getFormLookups } from "@/db/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "New insight" };

export default async function NewInsightPage() {
  const lookups = await getFormLookups();
  return (
    <PageContainer>
      <PageHeader
        title="New insight"
        description="Capture a durable observation about model or tool behaviour."
      />
      <InsightForm lookups={lookups} mode="create" />
    </PageContainer>
  );
}
