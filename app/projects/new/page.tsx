import { ProjectForm } from "@/components/forms/project-form";
import { PageContainer, PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <PageContainer>
      <PageHeader
        title="New project"
        description="Group your AI sessions by the work they support."
      />
      <ProjectForm mode="create" />
    </PageContainer>
  );
}
