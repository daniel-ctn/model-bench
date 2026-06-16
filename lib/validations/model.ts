import { z } from "zod";

import { MODEL_PROVIDERS, MODEL_STRENGTHS } from "@/db/schema";
import {
  optionalNonNegative,
  optionalNonNegativeInt,
  optionalText,
  requiredText,
} from "./shared";

export const modelFormSchema = z.object({
  provider: z.enum(MODEL_PROVIDERS),
  name: requiredText("Model name is required", 120),
  shortName: z.string().max(60),
  modelFamily: z.string().max(80),
  strengthLevel: z.enum(MODEL_STRENGTHS),
  pricingInputPerMTok: optionalNonNegative,
  pricingOutputPerMTok: optionalNonNegative,
  contextWindow: optionalNonNegativeInt,
  knowledgeCutoff: z.string().max(40),
  notes: optionalText(2000),
  active: z.boolean(),
});

export type ModelFormValues = z.infer<typeof modelFormSchema>;

export const modelDefaults: ModelFormValues = {
  provider: "OpenAI",
  name: "",
  shortName: "",
  modelFamily: "",
  strengthLevel: "flagship",
  pricingInputPerMTok: null,
  pricingOutputPerMTok: null,
  contextWindow: null,
  knowledgeCutoff: "",
  notes: "",
  active: true,
};
