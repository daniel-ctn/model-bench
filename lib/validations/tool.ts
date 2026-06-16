import { z } from "zod";

import { TOOL_CATEGORIES } from "@/db/schema";
import { optionalText, optionalUrl, requiredText } from "./shared";

export const toolFormSchema = z.object({
  name: requiredText("Tool name is required", 120),
  category: z.enum(TOOL_CATEGORIES),
  website: optionalUrl,
  notes: optionalText(2000),
});

export type ToolFormValues = z.infer<typeof toolFormSchema>;

export const toolDefaults: ToolFormValues = {
  name: "",
  category: "coding-agent",
  website: "",
  notes: "",
};
