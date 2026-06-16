import { z } from "zod";

import { PROJECT_STATUSES, PROJECT_TYPES } from "@/db/schema";
import { optionalText, requiredText } from "./shared";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const projectFormSchema = z.object({
  name: requiredText("Project name is required", 120),
  slug: z
    .string()
    .max(140)
    .refine((v) => v === "" || SLUG_RE.test(v), {
      message: "Use lowercase letters, numbers and dashes",
    }),
  description: optionalText(2000),
  type: z.enum(PROJECT_TYPES),
  status: z.enum(PROJECT_STATUSES),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour"),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const projectDefaults: ProjectFormValues = {
  name: "",
  slug: "",
  description: "",
  type: "personal",
  status: "active",
  color: "#7c5cff",
};
