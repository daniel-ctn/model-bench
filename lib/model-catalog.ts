import type { ModelProvider, ModelStrength } from "@/types";

export type CatalogModel = {
  provider: ModelProvider;
  name: string;
  shortName: string;
  modelFamily: string;
  strengthLevel: ModelStrength;
  /** USD per million input / output tokens. */
  pricingInputPerMTok: number | null;
  pricingOutputPerMTok: number | null;
  contextWindow: number | null;
  knowledgeCutoff: string | null;
};

/**
 * A starter catalog of current models so a new workspace isn't empty. Pricing
 * and context are best-effort defaults — verify and edit after importing.
 */
export const MODEL_CATALOG: CatalogModel[] = [
  // Anthropic
  { provider: "Anthropic", name: "Claude Opus 4.8", shortName: "Opus 4.8", modelFamily: "Claude", strengthLevel: "flagship", pricingInputPerMTok: 15, pricingOutputPerMTok: 75, contextWindow: 200_000, knowledgeCutoff: "2026-01" },
  { provider: "Anthropic", name: "Claude Sonnet 4.6", shortName: "Sonnet 4.6", modelFamily: "Claude", strengthLevel: "flagship", pricingInputPerMTok: 3, pricingOutputPerMTok: 15, contextWindow: 200_000, knowledgeCutoff: "2026-01" },
  { provider: "Anthropic", name: "Claude Haiku 4.5", shortName: "Haiku 4.5", modelFamily: "Claude", strengthLevel: "small", pricingInputPerMTok: 1, pricingOutputPerMTok: 5, contextWindow: 200_000, knowledgeCutoff: "2025-10" },
  // OpenAI
  { provider: "OpenAI", name: "GPT-5.1", shortName: "GPT-5.1", modelFamily: "GPT", strengthLevel: "flagship", pricingInputPerMTok: 1.25, pricingOutputPerMTok: 10, contextWindow: 400_000, knowledgeCutoff: "2025-09" },
  { provider: "OpenAI", name: "GPT-5.1 mini", shortName: "GPT-5.1 mini", modelFamily: "GPT", strengthLevel: "small", pricingInputPerMTok: 0.25, pricingOutputPerMTok: 2, contextWindow: 400_000, knowledgeCutoff: "2025-09" },
  { provider: "OpenAI", name: "o3", shortName: "o3", modelFamily: "o-series", strengthLevel: "reasoning", pricingInputPerMTok: 2, pricingOutputPerMTok: 8, contextWindow: 200_000, knowledgeCutoff: "2025-06" },
  // Google
  { provider: "Google", name: "Gemini 2.5 Pro", shortName: "Gemini 2.5 Pro", modelFamily: "Gemini", strengthLevel: "flagship", pricingInputPerMTok: 1.25, pricingOutputPerMTok: 10, contextWindow: 1_000_000, knowledgeCutoff: "2025-01" },
  { provider: "Google", name: "Gemini 2.5 Flash", shortName: "Gemini 2.5 Flash", modelFamily: "Gemini", strengthLevel: "small", pricingInputPerMTok: 0.3, pricingOutputPerMTok: 2.5, contextWindow: 1_000_000, knowledgeCutoff: "2025-01" },
  // xAI
  { provider: "xAI", name: "Grok 4", shortName: "Grok 4", modelFamily: "Grok", strengthLevel: "flagship", pricingInputPerMTok: 3, pricingOutputPerMTok: 15, contextWindow: 256_000, knowledgeCutoff: "2025" },
  // DeepSeek
  { provider: "DeepSeek", name: "DeepSeek V3.2", shortName: "DeepSeek V3.2", modelFamily: "DeepSeek", strengthLevel: "medium", pricingInputPerMTok: 0.28, pricingOutputPerMTok: 0.42, contextWindow: 128_000, knowledgeCutoff: "2025" },
  // Moonshot
  { provider: "Moonshot", name: "Kimi K2", shortName: "Kimi K2", modelFamily: "Kimi", strengthLevel: "coding-specialized", pricingInputPerMTok: 0.6, pricingOutputPerMTok: 2.5, contextWindow: 256_000, knowledgeCutoff: "2025" },
  // Alibaba
  { provider: "Alibaba", name: "Qwen3 Coder", shortName: "Qwen3 Coder", modelFamily: "Qwen", strengthLevel: "coding-specialized", pricingInputPerMTok: 0.3, pricingOutputPerMTok: 1.2, contextWindow: 256_000, knowledgeCutoff: "2025" },
];
