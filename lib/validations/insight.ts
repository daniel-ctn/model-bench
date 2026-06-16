import { z } from "zod";

import { CONFIDENCE_LEVELS, INSIGHT_STATUSES } from "@/db/schema";
import { idSelect, optionalText, requiredText } from "./shared";

export const insightFormSchema = z.object({
  title: requiredText("Insight title is required", 200),
  description: optionalText(4000),
  relatedToolId: idSelect,
  relatedModelId: idSelect,
  relatedProjectId: idSelect,
  confidence: z.enum(CONFIDENCE_LEVELS),
  status: z.enum(INSIGHT_STATUSES),
});

export type InsightFormValues = z.infer<typeof insightFormSchema>;

export const insightDefaults: InsightFormValues = {
  title: "",
  description: "",
  relatedToolId: "none",
  relatedModelId: "none",
  relatedProjectId: "none",
  confidence: "medium",
  status: "active",
};
