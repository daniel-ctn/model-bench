/**
 * Canonical geometry for the ModelBench "Measured-M" mark.
 *
 * One source of truth shared by the React components (`logo-mark.tsx`) and the
 * static-asset generator (`scripts/gen-brand-assets.ts`) so the favicon, app
 * icons, exports and in-app mark are pixel-identical.
 *
 * The mark, on a 0 0 32 32 grid:
 *   - an "instrument" M (the brand initial) — letterform in the foreground
 *   - a violet bench / datum rule the M stands on (the ledger every session is scored against)
 *   - a violet measurement tick rising from the M's valley to a confidence node
 *     ("a reading settling to its value" — the product's honest, confidence-aware thesis)
 */
export const MARK = {
  /** The M letterform (foreground / currentColor). */
  m: "M6 24 V6.5 L16 16.8 L26 6.5 V24",
  /** The bench / datum rule (accent). */
  bench: "M5.4 24 H26.6",
  /** The measurement tick rising from the valley (accent). */
  tick: "M16 16.4 V11.6",
  /** The confidence node — the reading that landed (accent). */
  node: { cx: 16, cy: 9.2, r: 2.1 },
  /** Approximate path length of `m`, for stroke-dashoffset draw animation. */
  mLength: 64,
  stroke: 2.4,
  /** Tile corner radius on the 32 grid (matches the app's rounded-lg chrome). */
  tileRadius: 7.5,
} as const;
