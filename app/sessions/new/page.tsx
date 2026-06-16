import { SessionForm } from "@/components/forms/session-form";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { getFormLookups } from "@/db/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "New session" };

export default async function NewSessionPage() {
  const lookups = await getFormLookups();
  return (
    <PageContainer>
      <PageHeader
        title="New session"
        description="Log an AI session and score what it was actually worth."
      />
      <SessionForm lookups={lookups} mode="create" />
    </PageContainer>
  );
}
