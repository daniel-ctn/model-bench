import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { getCurrentUser } from "@/lib/auth-helpers";

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
  const user = await getCurrentUser();

  return (
    <PageContainer>
      <PageHeader
        title="Account"
        description="Manage your profile and password."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Profile"
          contentClassName="divide-border/60 divide-y"
        >
          <Row label="Name" value={user?.name ?? "—"} />
          <Row label="Email" value={user?.email ?? "—"} />
        </SectionCard>
        <SectionCard
          title="Change password"
          description="Updating signs out other sessions."
        >
          <ChangePasswordForm />
        </SectionCard>
      </div>
    </PageContainer>
  );
}
