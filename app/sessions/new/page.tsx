import { SessionForm } from "@/components/forms/session-form";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { getFormLookups, listSessions } from "@/db/queries";
import { taskHints } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export const metadata = { title: "New session" };

export default async function NewSessionPage() {
  const [lookups, sessions] = await Promise.all([
    getFormLookups(),
    listSessions(),
  ]);
  return (
    <PageContainer>
      <PageHeader
        title="New session"
        description="Log an AI session and score what it was actually worth."
      />
      <SessionForm
        lookups={lookups}
        mode="create"
        taskHints={taskHints(sessions)}
      />
    </PageContainer>
  );
}
