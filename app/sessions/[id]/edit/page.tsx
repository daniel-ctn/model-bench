import { notFound } from "next/navigation";

import { SessionForm } from "@/components/forms/session-form";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { getFormLookups, getSessionById } from "@/db/queries";
import { sessionToFormValues } from "@/lib/session-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit session" };

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, lookups] = await Promise.all([
    getSessionById(id),
    getFormLookups(),
  ]);
  if (!session) notFound();

  return (
    <PageContainer>
      <PageHeader title="Edit session" description={session.title} />
      <SessionForm
        lookups={lookups}
        mode="edit"
        sessionId={id}
        initialValues={sessionToFormValues(session)}
      />
    </PageContainer>
  );
}
