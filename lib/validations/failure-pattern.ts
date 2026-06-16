import { z } from "zod";

import { FAILURE_TYPES, SEVERITIES } from "@/db/schema";
import { optionalText } from "./shared";

/** Failure pattern as captured inline inside the session form. */
export const failurePatternInputSchema = z.object({
  type: z.enum(FAILURE_TYPES),
  severity: z.enum(SEVERITIES),
  description: optionalText(1000),
  possibleFix: optionalText(1000),
});

export type FailurePatternInput = z.infer<typeof failurePatternInputSchema>;

export const failurePatternDefault: FailurePatternInput = {
  type: "misunderstood-intent",
  severity: "medium",
  description: "",
  possibleFix: "",
};
