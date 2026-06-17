/**
 * Estimate a session's cost from token counts and a model's per-million-token
 * pricing. Returns null when there isn't enough information to compute it.
 */
export function computeTokenCost(
  inputTokens: number | null | undefined,
  outputTokens: number | null | undefined,
  pricing: {
    pricingInputPerMTok?: number | null;
    pricingOutputPerMTok?: number | null;
  } | null | undefined,
): number | null {
  if (!pricing) return null;
  const inRate = pricing.pricingInputPerMTok;
  const outRate = pricing.pricingOutputPerMTok;
  const inTok = inputTokens ?? 0;
  const outTok = outputTokens ?? 0;
  if ((inTok <= 0 || inRate == null) && (outTok <= 0 || outRate == null)) {
    return null;
  }
  const cost =
    (inRate != null ? (inTok / 1_000_000) * inRate : 0) +
    (outRate != null ? (outTok / 1_000_000) * outRate : 0);
  return Math.round(cost * 10000) / 10000;
}
