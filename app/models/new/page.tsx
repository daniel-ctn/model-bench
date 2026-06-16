import { ModelForm } from "@/components/forms/model-form";
import { PageContainer, PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "New model" };

export default function NewModelPage() {
  return (
    <PageContainer>
      <PageHeader
        title="New model"
        description="Track a model so its sessions can be scored and compared."
      />
      <ModelForm mode="create" />
    </PageContainer>
  );
}
