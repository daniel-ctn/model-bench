import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/forms/project-form";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { getProjectById } from "@/db/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit project" };

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  return (
    <PageContainer>
      <PageHeader title="Edit project" description={project.name} />
      <ProjectForm
        mode="edit"
        projectId={id}
        initialValues={{
          name: project.name,
          slug: project.slug,
          description: project.description ?? "",
          type: project.type,
          status: project.status,
          color: project.color,
        }}
      />
    </PageContainer>
  );
}
