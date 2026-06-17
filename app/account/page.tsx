import { eq } from "drizzle-orm";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { BudgetCard } from "@/components/account/budget-card";
import { IngestTokenCard } from "@/components/account/ingest-token-card";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getCurrentUser, requireUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export const metadata = { title: "Account" };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default async function AccountPage() {
  const userId = await requireUserId();
  const current = await getCurrentUser();
  const row = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { ingestToken: true, monthlyBudgetUsd: true },
  });
  const endpoint = `${process.env.BETTER_AUTH_URL ?? ""}/api/sessions/ingest`;

  return (
    <PageContainer>
      <PageHeader
        title="Account"
        description="Manage your profile, password and agent ingestion."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Profile"
          contentClassName="divide-border/60 divide-y"
        >
          <Row label="Name" value={current?.name ?? "—"} />
          <Row label="Email" value={current?.email ?? "—"} />
        </SectionCard>
        <SectionCard
          title="Change password"
          description="Updating signs out other sessions."
        >
          <ChangePasswordForm />
        </SectionCard>
        <SectionCard
          title="Monthly budget"
          description="Your spend target for budget alerts and projections."
          className="lg:col-span-2"
        >
          <BudgetCard initial={row?.monthlyBudgetUsd ?? null} />
        </SectionCard>
        <SectionCard
          title="Agent ingestion"
          description="Let an agent log session drafts via the API."
          className="lg:col-span-2"
        >
          <IngestTokenCard
            initialToken={row?.ingestToken ?? null}
            endpoint={endpoint}
          />
        </SectionCard>
      </div>
    </PageContainer>
  );
}
