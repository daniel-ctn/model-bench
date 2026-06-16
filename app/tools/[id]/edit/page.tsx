import { notFound } from "next/navigation";

import { ToolForm } from "@/components/forms/tool-form";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { getToolById } from "@/db/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit tool" };

export default async function EditToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = await getToolById(id);
  if (!tool) notFound();

  return (
    <PageContainer>
      <PageHeader title="Edit tool" description={tool.name} />
      <ToolForm
        mode="edit"
        toolId={id}
        initialValues={{
          name: tool.name,
          category: tool.category,
          website: tool.website ?? "",
          notes: tool.notes ?? "",
        }}
      />
    </PageContainer>
  );
}
