/**
 * Brand asset generator — single source of truth for every static ModelBench
 * brand file. It (1) writes the source SVGs in `public/brand/` and `app/` from
 * the shared {@link MARK} geometry, then (2) rasterizes the favicon, app icons,
 * PWA/manifest icons and the Open Graph image with sharp + png-to-ico.
 *
 * Run:  pnpm tsx scripts/gen-brand-assets.ts
 *
 * The PNG/ICO outputs are derived — never hand-edit them. To change the mark,
 * edit `components/brand/geometry.ts` (shared with the React components) and
 * re-run this script.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";
import { MARK } from "../components/brand/geometry";

const ROOT = process.cwd();
const BRAND = join(ROOT, "public", "brand");
const ICONS_OUT = join(ROOT, "public", "icons");
const APP = join(ROOT, "app");

// sRGB hexes derived from the oklch design tokens (globals.css).
const C = {
  violet: "#976ef1", // --primary (dark)
  violetLight: "#7f4bdc", // --primary (light)
  white: "#ffffff",
  nearWhite: "#f0f2f6", // --foreground (dark)
  ink: "#141720", // --foreground (light)
  darkBg: "#0d0e14", // --background (dark)
  muted: "#999eab", // --muted-foreground (dark)
  mutedLight: "#5b5b6b",
  lightBg: "#f9fafc",
};

const SW = MARK.stroke;
const FONT = "'Space Grotesk','Geist Sans',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif";

/** The four mark elements at the canonical 0 0 32 32 geometry. */
function markInner(fg: string, accent: string, opts: { reduced?: boolean } = {}) {
  const m = `<path class="mb-m" d="${MARK.m}" fill="none" stroke="${fg}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const bench = `<path class="mb-bench" d="${MARK.bench}" stroke="${accent}" stroke-width="${SW}" stroke-linecap="round"/>`;
  if (opts.reduced) return `${m}\n${bench}`;
  const tick = `<path class="mb-tick" d="${MARK.tick}" stroke="${accent}" stroke-width="${SW}" stroke-linecap="round"/>`;
  const node = `<circle class="mb-node" cx="${MARK.node.cx}" cy="${MARK.node.cy}" r="${MARK.node.r}" fill="${accent}"/>`;
  return `${m}\n${bench}\n${tick}\n${node}`;
}

// Base = fully-drawn static mark; motion is added only when allowed and animates
// FROM hidden with `both` fill, so the mark is never left invisible.
const ANIM_STYLE = `<style>
@keyframes mb-draw{from{stroke-dashoffset:var(--mb-len)}to{stroke-dashoffset:0}}
@keyframes mb-node-in{0%{opacity:0;transform:scale(.2)}60%{opacity:1}100%{opacity:1;transform:scale(1)}}
.mb-m{--mb-len:64;stroke-dasharray:64}
.mb-bench{--mb-len:22;stroke-dasharray:22}
.mb-tick{--mb-len:7;stroke-dasharray:7}
@media (prefers-reduced-motion: no-preference){
 .mb-m{animation:mb-draw .9s cubic-bezier(.5,.15,.2,1) .05s both}
 .mb-bench{animation:mb-draw .5s ease-out both}
 .mb-tick{animation:mb-draw .4s ease-out .72s both}
 .mb-node{transform-box:fill-box;transform-origin:center;animation:mb-node-in .5s cubic-bezier(.34,1.4,.5,1) .98s both}
}</style>`;

/** Rounded violet tile + white mark (favicon / app chrome / universal mark). */
function tileSvg({ animated = false, reduced = false } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" role="img" aria-label="ModelBench">
<title>ModelBench</title>${animated ? ANIM_STYLE : ""}
<rect width="32" height="32" rx="${MARK.tileRadius}" fill="${C.violet}"/>
${markInner(C.white, C.white, { reduced })}
</svg>`;
}

/** Full-bleed violet square + white mark, sized inside the maskable safe zone. */
function maskableSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" role="img" aria-label="ModelBench">
<title>ModelBench</title>
<rect width="32" height="32" fill="${C.violet}"/>
${markInner(C.white, C.white)}
</svg>`;
}

/** Horizontal lockup: tile mark + Space Grotesk wordmark + "Journal" eyebrow. */
function logoSvg({ light = false, animated = false } = {}) {
  const eyebrow = light ? C.mutedLight : C.muted;
  const word = light ? C.ink : C.nearWhite;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 188 44" width="188" height="44" role="img" aria-label="ModelBench — Journal">
<title>ModelBench — Journal</title>${animated ? ANIM_STYLE : ""}
<svg x="0" y="2" width="40" height="40" viewBox="0 0 32 32">
<rect width="32" height="32" rx="${MARK.tileRadius}" fill="${C.violet}"/>
${markInner(C.white, C.white)}
</svg>
<text x="52" y="25.5" font-family="${FONT}" font-size="21" font-weight="600" letter-spacing="-0.4" fill="${word}">ModelBench</text>
<text x="52.5" y="37.5" font-family="${FONT}" font-size="8.5" font-weight="600" letter-spacing="2.4" fill="${eyebrow}">JOURNAL</text>
</svg>`;
}

/** 1200×630 Open Graph / brand card. */
function ogSvg() {
  const W = 1200,
    H = 630;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
<pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
<path d="M56 0H0V56" fill="none" stroke="${C.white}" stroke-opacity="0.04" stroke-width="1"/>
</pattern>
<filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
<feGaussianBlur stdDeviation="90"/>
</filter>
</defs>
<rect width="${W}" height="${H}" fill="${C.darkBg}"/>
<rect width="${W}" height="${H}" fill="url(#grid)"/>
<circle cx="940" cy="150" r="150" fill="${C.violet}" fill-opacity="0.18" filter="url(#glow)"/>
<rect x="88" y="300" width="1024" height="1" fill="${C.white}" fill-opacity="0.08"/>
<svg x="88" y="150" width="120" height="120" viewBox="0 0 32 32">
<rect width="32" height="32" rx="${MARK.tileRadius}" fill="${C.violet}"/>
${markInner(C.white, C.white)}
</svg>
<text x="232" y="214" font-family="${FONT}" font-size="62" font-weight="600" letter-spacing="-1.5" fill="${C.nearWhite}">ModelBench</text>
<text x="234" y="252" font-family="${FONT}" font-size="17" font-weight="600" letter-spacing="6" fill="${C.violet}">JOURNAL</text>
<text x="90" y="392" font-family="${FONT}" font-size="40" font-weight="500" letter-spacing="-0.5" fill="${C.nearWhite}">Track the real value of every AI model.</text>
<text x="90" y="452" font-family="${FONT}" font-size="24" font-weight="400" fill="${C.muted}">Honest, confidence-aware benchmarks from your own sessions — not vanity metrics.</text>
</svg>`;
}

async function rasterize(svg: string, size: number) {
  return sharp(Buffer.from(svg), { density: 512 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function main() {
  await mkdir(BRAND, { recursive: true });
  await mkdir(ICONS_OUT, { recursive: true });

  // ---- 1. Source SVGs ----
  const files: Record<string, string> = {
    [join(BRAND, "logo-mark.svg")]: tileSvg(),
    [join(BRAND, "logo-mark-animated.svg")]: tileSvg({ animated: true }),
    [join(BRAND, "logo.svg")]: logoSvg(),
    [join(BRAND, "logo-animated.svg")]: logoSvg({ animated: true }),
    [join(BRAND, "logo-light.svg")]: logoSvg({ light: true }),
    [join(BRAND, "icon-maskable.svg")]: maskableSvg(),
    [join(BRAND, "icon-16.svg")]: tileSvg({ reduced: true }),
    [join(BRAND, "og.svg")]: ogSvg(),
    [join(APP, "icon.svg")]: tileSvg(),
  };
  for (const [path, svg] of Object.entries(files)) {
    await writeFile(path, svg.trimStart() + "\n");
    console.log("✓ svg", path.replace(ROOT, "."));
  }

  // ---- 2. Raster outputs ----
  // favicon.ico — 16 uses the reduced glyph, 32/48 the full mark (crisp at all sizes).
  const ico = await pngToIco([
    await rasterize(tileSvg({ reduced: true }), 16),
    await rasterize(tileSvg(), 32),
    await rasterize(tileSvg(), 48),
  ]);
  await writeFile(join(APP, "favicon.ico"), ico);
  console.log("✓ app/favicon.ico 16/32/48");

  // apple-icon (iOS rounds it itself → full-bleed maskable).
  await writeFile(join(APP, "apple-icon.png"), await rasterize(maskableSvg(), 180));
  console.log("✓ app/apple-icon.png 180");

  // PWA / manifest icons.
  for (const size of [192, 512]) {
    await writeFile(join(ICONS_OUT, `icon-${size}.png`), await rasterize(maskableSvg(), size));
    console.log(`✓ public/icons/icon-${size}.png`);
  }
  // raster fallbacks of the rounded mark for legacy / social contexts.
  for (const size of [32, 180]) {
    await writeFile(join(ICONS_OUT, `mark-${size}.png`), await rasterize(tileSvg(), size));
  }

  // Open Graph image (+ a public copy as a brand export).
  const ogPng = await sharp(Buffer.from(ogSvg()), { density: 144 }).png().toBuffer();
  await writeFile(join(APP, "opengraph-image.png"), ogPng);
  await writeFile(join(BRAND, "og.png"), ogPng);
  console.log("✓ app/opengraph-image.png 1200x630");

  console.log("\nBrand assets generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
