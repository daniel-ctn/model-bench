import "server-only";

import { listModels } from "./models";
import { listProjects } from "./projects";
import { listTools } from "./tools";

/** Lightweight bundle of related records for populating form <Select>s. */
export async function getFormLookups() {
  const [projects, tools, models] = await Promise.all([
    listProjects(),
    listTools(),
    listModels(),
  ]);
  return { projects, tools, models };
}

export type FormLookups = Awaited<ReturnType<typeof getFormLookups>>;
