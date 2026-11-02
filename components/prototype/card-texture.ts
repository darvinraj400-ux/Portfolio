import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
} from "three";

export type CardPrint = {
  titleLines: string[];
  category: string;
  index: string;
  total: number;
};

type ArtVariant = {
  cx: number;
  cy: number;
  r: number;
  sag: number;
};

export type CardAtlas = {
  texture: CanvasTexture;
  uvs: { u0: number; v0: number; u1: number; v1: number }[];
};

const WIDTH = 1024;
const HEIGHT = 1280;

/**
 * Six deterministic still-life crops of the same silver-sphere study.
 * Variant 0 is the approved Stage 1C composition and must stay unchanged.
 */
const ART_VARIANTS: ArtVariant[] = [
  { cx: 628, cy: 464, r: 190, sag: 14 },
  { cx: 548, cy: 498, r: 208, sag: 12 },
  { cx: 694, cy: 436, r: 168, sag: 17 },
  { cx: 604, cy: 424, r: 226, sag: 11 },
  { cx: 712, cy: 526, r: 176, sag: 15 },
  { cx: 538, cy: 420, r: 158, sag: 18 },
];

export function getArtVariant(seed: number): ArtVariant {
  const index = ((seed % ART_VARIANTS.length) + ART_VARIANTS.length) %
    ART_VARIANTS.length;
  return ART_VARIANTS[index];
}

type TrackingContext = CanvasRenderingContext2D & {
  letterSpacing?: string;
};

export type CardFonts = { sans: string; mono: string };

let grainCanvas: HTMLCanvasElement | null = null;

export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export function hairline(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  alpha: number,
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: "left" | "right" = "left",
) {
  const characters = Array.from(text);
  const widths = characters.map((character) => ctx.measureText(character).width);
  const total =
    widths.reduce((sum, width) => sum + width, 0) + spacing * (widths.length - 1);
  let cursor = align === "right" ? x - total : x;
  const previousAlign = ctx.textAlign;
  ctx.textAlign = "left";

  characters.forEach((character, index) => {
    ctx.fillText(character, cursor, y);
    cursor += widths[index] + spacing;
  });

  ctx.textAlign = previousAlign;
}

export function setTracking(ctx: CanvasRenderingContext2D, value: string) {
  const tracking = ctx as TrackingContext;
  if ("letterSpacing" in tracking) {
    tracking.letterSpacing = value;
  }
}

function fontFamily(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value || fallback;
}

function resolveFonts(): CardFonts {
  return {
    sans:
      getComputedStyle(document.body).fontFamily ||
      fontFamily("--font-sans", "system-ui, sans-serif"),
    mono: fontFamily("--font-mono", "ui-monospace, monospace"),
  };
}

export function getCardFonts(): CardFonts {
  return resolveFonts();
}

async function fontsReady(): Promise<void> {
  try {
    await document.fonts.ready;
  } catch {
    // System fallbacks are used if font loading cannot be observed.
  }
}

export function paintArtwork(
  ctx: CanvasRenderingContext2D,
  variant: ArtVariant,
) {
  const { cx, cy, r, sag } = variant;
  const horizonY = cy + r * 0.22;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  const base = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  base.addColorStop(0, "#8f8f92");
  base.addColorStop(0.28, "#c9c9cb");
  base.addColorStop(0.52, "#a2a2a5");
  base.addColorStop(0.7, "#4a4a4d");
  base.addColorStop(0.86, "#161618");
  base.addColorStop(1, "#040405");
  ctx.fillStyle = base;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  const key = ctx.createRadialGradient(
    cx - r * 0.4,
    cy - r * 0.44,
    r * 0.04,
    cx - r * 0.28,
    cy - r * 0.3,
    r * 0.86,
  );
  key.addColorStop(0, "rgba(255, 255, 255, 0.42)");
  key.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
  key.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = key;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  const falloff = ctx.createRadialGradient(
    cx + r * 0.46,
    cy + r * 0.5,
    r * 0.08,
    cx + r * 0.16,
    cy + r * 0.18,
    r * 1.15,
  );
  falloff.addColorStop(0, "rgba(0, 0, 0, 0.5)");
  falloff.addColorStop(0.6, "rgba(0, 0, 0, 0.16)");
  falloff.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = falloff;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  const reflection = (
    x: number,
    y: number,
    width: number,
    height: number,
    angle: number,
    blur: number,
    alpha: number,
  ) => {
    ctx.save();
    ctx.filter = `blur(${blur}px)`;
    ctx.translate(x, y);
    ctx.rotate(angle);
    const gradient = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(0.22, `rgba(255, 255, 255, ${alpha})`);
    gradient.addColorStop(0.62, `rgba(255, 255, 255, ${alpha})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.restore();
  };

  reflection(cx - r * 0.42, cy - r * 0.3, r * 0.19, r * 0.96, -0.17, 4, 0.85);
  reflection(cx - r * 0.26, cy - r * 0.16, r * 0.64, r * 0.7, -0.17, 20, 0.18);
  reflection(cx + r * 0.58, cy + r * 0.02, r * 0.1, r * 0.8, 0.05, 8, 0.3);

  const ground = ctx.createLinearGradient(0, horizonY + sag, 0, cy + r);
  ground.addColorStop(0, "rgba(34, 34, 38, 0)");
  ground.addColorStop(0.16, "rgba(34, 34, 38, 0.5)");
  ground.addColorStop(0.36, "rgba(24, 24, 27, 0.88)");
  ground.addColorStop(0.62, "#111113");
  ground.addColorStop(0.84, "#0b0b0d");
  ground.addColorStop(1, "#08080a");
  ctx.beginPath();
  ctx.moveTo(cx - r, horizonY + sag);
  ctx.quadraticCurveTo(cx, horizonY - sag, cx + r, horizonY + sag);
  ctx.lineTo(cx + r, cy + r);
  ctx.lineTo(cx - r, cy + r);
  ctx.closePath();
  ctx.fillStyle = ground;
  ctx.fill();

  const wallGlow = ctx.createLinearGradient(0, horizonY - 58, 0, horizonY + 22);
  wallGlow.addColorStop(0, "rgba(255, 255, 255, 0)");
  wallGlow.addColorStop(0.62, "rgba(255, 255, 255, 0.16)");
  wallGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.save();
  ctx.filter = "blur(18px)";
  ctx.fillStyle = wallGlow;
  ctx.fillRect(cx - r, horizonY - 58, r * 2, 80);
  ctx.restore();

  ctx.save();
  ctx.filter = "blur(1.2px)";
  ctx.beginPath();
  ctx.moveTo(cx - r, horizonY + sag);
  ctx.quadraticCurveTo(cx, horizonY - sag, cx + r, horizonY + sag);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();

  const floorReflection = ctx.createLinearGradient(
    cx - r * 0.26,
    0,
    cx + r * 0.26,
    0,
  );
  floorReflection.addColorStop(0, "rgba(255, 255, 255, 0)");
  floorReflection.addColorStop(0.5, "rgba(255, 255, 255, 0.13)");
  floorReflection.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.save();
  ctx.filter = "blur(20px)";
  ctx.fillStyle = floorReflection;
  ctx.fillRect(cx - r * 0.26, horizonY + 26, r * 0.52, r * 0.5);
  ctx.restore();

  const edge = ctx.createRadialGradient(
    cx - r * 0.12,
    cy - r * 0.18,
    r * 0.34,
    cx,
    cy,
    r,
  );
  edge.addColorStop(0, "rgba(0, 0, 0, 0)");
  edge.addColorStop(0.76, "rgba(0, 0, 0, 0)");
  edge.addColorStop(1, "rgba(0, 0, 0, 0.5)");
  ctx.fillStyle = edge;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r - 1, Math.PI * 0.96, Math.PI * 1.54);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r - 1, -Math.PI * 0.04, Math.PI * 0.38);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.26)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function paintCardBase(
  ctx: CanvasRenderingContext2D,
  variant: ArtVariant,
) {
  const base = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  base.addColorStop(0, "#111113");
  base.addColorStop(0.48, "#09090b");
  base.addColorStop(1, "#050506");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const bloom = ctx.createRadialGradient(600, 300, 40, 600, 300, 760);
  bloom.addColorStop(0, "rgba(255, 255, 255, 0.055)");
  bloom.addColorStop(0.55, "rgba(255, 255, 255, 0.012)");
  bloom.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const edgeShade = ctx.createLinearGradient(0, 0, WIDTH, 0);
  edgeShade.addColorStop(0, "rgba(0, 0, 0, 0.5)");
  edgeShade.addColorStop(0.12, "rgba(0, 0, 0, 0)");
  edgeShade.addColorStop(0.88, "rgba(0, 0, 0, 0)");
  edgeShade.addColorStop(1, "rgba(0, 0, 0, 0.5)");
  ctx.fillStyle = edgeShade;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const edgeShadeVertical = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  edgeShadeVertical.addColorStop(0, "rgba(0, 0, 0, 0.45)");
  edgeShadeVertical.addColorStop(0.1, "rgba(0, 0, 0, 0)");
  edgeShadeVertical.addColorStop(0.9, "rgba(0, 0, 0, 0)");
  edgeShadeVertical.addColorStop(1, "rgba(0, 0, 0, 0.55)");
  ctx.fillStyle = edgeShadeVertical;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  roundedRect(ctx, 52, 52, WIDTH - 104, HEIGHT - 104, 26);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  paintArtwork(ctx, variant);
}

function paintCardText(
  ctx: CanvasRenderingContext2D,
  print: CardPrint,
  fonts: CardFonts,
) {
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "rgba(214, 214, 214, 0.92)";
  ctx.font = `400 27px ${fonts.mono}`;
  drawTracked(ctx, "DARVINN STUDIO", 84, 118, 3.2);

  ctx.fillStyle = "rgba(150, 150, 150, 0.95)";
  drawTracked(
    ctx,
    `${print.index} / ${String(print.total).padStart(2, "0")}`,
    940,
    118,
    3.2,
    "right",
  );

  hairline(ctx, 84, 158, 940, 158, 0.13);

  ctx.fillStyle = "rgba(150, 150, 150, 0.95)";
  ctx.font = `400 26px ${fonts.mono}`;
  drawTracked(ctx, print.category, 84, 792, 1.6);

  const lines = print.titleLines.filter((line) => line.trim().length > 0);
  if (lines.length > 0) {
    ctx.fillStyle = "#f2f2f2";
    ctx.font = `600 104px ${fonts.sans}`;
    setTracking(ctx, "-3px");
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
    const available = 856;
    const size = Math.min(104, Math.floor((104 * available) / widest));
    ctx.font = `600 ${size}px ${fonts.sans}`;
    setTracking(ctx, `${(-size * 0.032).toFixed(2)}px`);

    const lineHeight = size * 1.02;
    const lastBaseline = 1010;
    lines.forEach((line, index) => {
      ctx.fillText(
        line,
        80,
        lastBaseline - (lines.length - 1 - index) * lineHeight,
      );
    });
    setTracking(ctx, "0px");
  }

  hairline(ctx, 84, 1082, 940, 1082, 0.13);

  ctx.fillStyle = "rgba(138, 138, 138, 0.95)";
  ctx.font = `400 25px ${fonts.mono}`;
  drawTracked(ctx, "Placeholder artwork", 84, 1140, 1.6);

  ctx.fillStyle = "rgba(214, 214, 214, 0.92)";
  drawTracked(ctx, "2026", 940, 1140, 3.2, "right");
}

function getGrainCanvas(): HTMLCanvasElement {
  if (grainCanvas) return grainCanvas;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const image = ctx.createImageData(canvas.width, canvas.height);
  for (let index = 0; index < image.data.length; index += 4) {
    const value = Math.floor(Math.random() * 255);
    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value;
    image.data[index + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  grainCanvas = canvas;
  return canvas;
}

function addGrain(ctx: CanvasRenderingContext2D) {
  addGrainTo(ctx, WIDTH, HEIGHT);
}

export function addGrainTo(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.04;
  ctx.drawImage(getGrainCanvas(), 0, 0, width, height);
  ctx.restore();
}

function paintCardFace(
  ctx: CanvasRenderingContext2D,
  print: CardPrint,
  fonts: CardFonts,
  variant: ArtVariant,
  width: number,
  height: number,
  x: number,
  y: number,
) {
  const sx = width / WIDTH;
  const sy = height / HEIGHT;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  paintCardBase(ctx, variant);
  paintCardText(ctx, print, fonts);
  addGrain(ctx);
  ctx.restore();
}

export function buildSheenTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("A 2D canvas context is unavailable.");
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.filter = "blur(18px)";

  ctx.save();
  ctx.translate(356, 140);
  ctx.rotate(0.52);
  const streak = ctx.createLinearGradient(-34, 0, 34, 0);
  streak.addColorStop(0, "rgba(255, 255, 255, 0)");
  streak.addColorStop(0.5, "rgba(255, 255, 255, 0.55)");
  streak.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = streak;
  ctx.fillRect(-34, -190, 68, 380);
  ctx.restore();

  ctx.save();
  ctx.translate(392, 96);
  ctx.rotate(0.32);
  const broad = ctx.createLinearGradient(-90, 0, 90, 0);
  broad.addColorStop(0, "rgba(255, 255, 255, 0)");
  broad.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
  broad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = broad;
  ctx.fillRect(-90, -130, 180, 260);
  ctx.restore();

  ctx.save();
  ctx.translate(92, 420);
  ctx.rotate(0.1);
  const edge = ctx.createLinearGradient(-16, 0, 16, 0);
  edge.addColorStop(0, "rgba(255, 255, 255, 0)");
  edge.addColorStop(0.5, "rgba(255, 255, 255, 0.26)");
  edge.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = edge;
  ctx.fillRect(-16, -170, 32, 340);
  ctx.restore();

  ctx.save();
  ctx.translate(250, 470);
  ctx.rotate(-0.22);
  const lower = ctx.createLinearGradient(-150, 0, 150, 0);
  lower.addColorStop(0, "rgba(255, 255, 255, 0)");
  lower.addColorStop(0.5, "rgba(255, 255, 255, 0.075)");
  lower.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = lower;
  ctx.fillRect(-150, -40, 300, 80);
  ctx.restore();

  ctx.restore();

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export async function buildCardTexture(
  print: CardPrint,
  variantSeed = 0,
): Promise<CanvasTexture> {
  if (typeof document === "undefined") {
    throw new Error("The card print requires a browser document.");
  }

  await fontsReady();

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("A 2D canvas context is unavailable.");
  }

  paintCardFace(
    ctx,
    print,
    resolveFonts(),
    getArtVariant(variantSeed),
    WIDTH,
    HEIGHT,
    0,
    0,
  );

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/**
 * One six-by-six atlas for every card in the spiral. The six artwork
 * variants are rendered once and reused; only the typography differs per
 * tile. UVs are returned per slot so each card can sample its own tile
 * without cloning the texture.
 */
export async function buildCardAtlas(
  prints: CardPrint[],
  options: { tileWidth: number; tileHeight: number; columns?: number },
): Promise<CardAtlas> {
  if (typeof document === "undefined") {
    throw new Error("The card atlas requires a browser document.");
  }

  await fontsReady();

  const columns = options.columns ?? 6;
  const rows = Math.ceil(prints.length / columns);
  const { tileWidth, tileHeight } = options;
  const atlasWidth = columns * tileWidth;
  const atlasHeight = rows * tileHeight;

  const canvas = document.createElement("canvas");
  canvas.width = atlasWidth;
  canvas.height = atlasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("A 2D canvas context is unavailable.");
  }

  const fonts = resolveFonts();
  const bases = new Map<number, HTMLCanvasElement>();
  const baseFor = (variantIndex: number) => {
    const cached = bases.get(variantIndex);
    if (cached) return cached;

    const base = document.createElement("canvas");
    base.width = tileWidth;
    base.height = tileHeight;
    const baseContext = base.getContext("2d");
    if (!baseContext) {
      throw new Error("A 2D canvas context is unavailable.");
    }
    baseContext.save();
    baseContext.scale(tileWidth / WIDTH, tileHeight / HEIGHT);
    paintCardBase(baseContext, getArtVariant(variantIndex));
    baseContext.restore();
    bases.set(variantIndex, base);
    return base;
  };

  prints.forEach((print, slot) => {
    const column = slot % columns;
    const row = Math.floor(slot / columns);
    const x = column * tileWidth;
    const y = row * tileHeight;

    ctx.drawImage(baseFor(slot % ART_VARIANTS.length), x, y);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(tileWidth / WIDTH, tileHeight / HEIGHT);
    paintCardText(ctx, print, fonts);
    addGrain(ctx);
    ctx.restore();
  });

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  const uvs = prints.map((_, slot) => {
    const column = slot % columns;
    const row = Math.floor(slot / columns);
    const u0 = (column * tileWidth) / atlasWidth;
    const u1 = ((column + 1) * tileWidth) / atlasWidth;
    const v1 = 1 - (row * tileHeight) / atlasHeight;
    const v0 = 1 - ((row + 1) * tileHeight) / atlasHeight;
    return { u0, v0, u1, v1 };
  });

  return { texture, uvs };
}
