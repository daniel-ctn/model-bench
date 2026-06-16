import { ToolForm } from "@/components/forms/tool-form";
import { PageContainer, PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "New tool" };

export default function NewToolPage() {
  return (
    <PageContainer>
      <PageHeader
        title="New tool"
        description="Add an AI tool you work through."
      />
      <ToolForm mode="create" />
    </PageContainer>
  );
}
