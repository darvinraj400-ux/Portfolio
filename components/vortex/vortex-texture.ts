import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
} from "three";
import {
  addGrainTo,
  drawTracked,
  getArtVariant,
  getCardFonts,
  hairline,
  paintArtwork,
  roundedRect,
  setTracking,
  type CardFonts,
  type CardPrint,
} from "@/components/prototype/card-texture";

export type UvRect = { u0: number; v0: number; u1: number; v1: number };

export type VortexAtlas = {
  texture: CanvasTexture;
  fronts: UvRect[];
  backs: UvRect[];
};

const FACE_WIDTH = 1024;
const FACE_HEIGHT = 724;
const SPLIT = 574;
const LEFT = 64;
const LEFT_RIGHT = 540;
const RIGHT_RIGHT = 960;

const BACK_BARS = [
  14, 22, 9, 18, 26, 12, 20, 8, 24, 16, 11, 27, 15, 21, 10, 23, 13, 19, 7,
  25, 17, 12, 22, 9, 20, 15,
];

function paintSharedBase(ctx: CanvasRenderingContext2D) {
  const base = ctx.createLinearGradient(0, 0, FACE_WIDTH, FACE_HEIGHT);
  base.addColorStop(0, "#121214");
  base.addColorStop(0.5, "#0a0a0c");
  base.addColorStop(1, "#050506");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, FACE_WIDTH, FACE_HEIGHT);

  const bloom = ctx.createRadialGradient(340, 90, 20, 340, 90, 640);
  bloom.addColorStop(0, "rgba(255, 255, 255, 0.05)");
  bloom.addColorStop(0.55, "rgba(255, 255, 255, 0.012)");
  bloom.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, FACE_WIDTH, FACE_HEIGHT);
}

function paintFront(ctx: CanvasRenderingContext2D, print: CardPrint, seed: number) {
  paintSharedBase(ctx);

  const panel = ctx.createLinearGradient(SPLIT, 0, FACE_WIDTH, FACE_HEIGHT);
  panel.addColorStop(0, "#08080a");
  panel.addColorStop(0.62, "#060607");
  panel.addColorStop(1, "#030304");
  ctx.fillStyle = panel;
  ctx.fillRect(SPLIT, 0, FACE_WIDTH - SPLIT, FACE_HEIGHT);

  const art = getArtVariant(seed);
  paintArtwork(ctx, { cx: 800, cy: 300, r: 198, sag: art.sag });

  const panelLight = ctx.createLinearGradient(SPLIT, 0, FACE_WIDTH, 0);
  panelLight.addColorStop(0, "rgba(255, 255, 255, 0)");
  panelLight.addColorStop(0.55, "rgba(255, 255, 255, 0.012)");
  panelLight.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = panelLight;
  ctx.fillRect(SPLIT, 0, FACE_WIDTH - SPLIT, FACE_HEIGHT);

  hairline(ctx, SPLIT, 24, SPLIT, FACE_HEIGHT - 24, 0.16);

  const vignette = ctx.createRadialGradient(430, 330, 190, 430, 330, 720);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(0.7, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.46)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, FACE_WIDTH, FACE_HEIGHT);

  const edge = ctx.createLinearGradient(0, 0, 150, 0);
  edge.addColorStop(0, "rgba(0, 0, 0, 0.4)");
  edge.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, 150, FACE_HEIGHT);
}

function paintFrontText(
  ctx: CanvasRenderingContext2D,
  print: CardPrint,
  fonts: CardFonts,
) {
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "rgba(222, 222, 224, 0.92)";
  ctx.font = `400 20px ${fonts.mono}`;
  drawTracked(ctx, "DARVINN STUDIO", LEFT, 98, 2.8);

  ctx.fillStyle = "rgba(150, 150, 152, 0.95)";
  drawTracked(ctx, print.index, LEFT_RIGHT, 98, 2.8, "right");

  hairline(ctx, LEFT, 132, LEFT_RIGHT, 132, 0.15);

  ctx.fillStyle = "rgba(153, 153, 155, 0.95)";
  ctx.font = `400 22px ${fonts.mono}`;
  drawTracked(ctx, print.category, LEFT, 286, 1.4);

  const lines = print.titleLines.filter((line) => line.trim().length > 0);
  if (lines.length > 0) {
    let size = 96;
    const available = LEFT_RIGHT - LEFT;
    ctx.fillStyle = "#f2f2f2";
    ctx.font = `600 ${size}px ${fonts.sans}`;
    setTracking(ctx, "-3px");
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
    size = Math.min(size, Math.floor((size * available) / widest));
    ctx.font = `600 ${size}px ${fonts.sans}`;
    setTracking(ctx, `${(-size * 0.03).toFixed(2)}px`);
    const lineHeight = size * 1.03;
    const lastBaseline = 492;
    lines.forEach((line, index) => {
      ctx.fillText(
        line,
        LEFT,
        lastBaseline - (lines.length - 1 - index) * lineHeight,
      );
    });
    setTracking(ctx, "0px");
  }

  hairline(ctx, LEFT, 604, LEFT_RIGHT, 604, 0.13);

  ctx.fillStyle = "rgba(138, 138, 140, 0.95)";
  ctx.font = `400 19px ${fonts.mono}`;
  drawTracked(ctx, "Placeholder artwork", LEFT, 656, 1.4);

  ctx.fillStyle = "rgba(214, 214, 216, 0.9)";
  drawTracked(ctx, "2026", LEFT_RIGHT, 656, 2.6, "right");

  ctx.fillStyle = "rgba(138, 138, 140, 0.9)";
  ctx.font = `400 19px ${fonts.mono}`;
  drawTracked(ctx, "SILVER STUDY", SPLIT + 24, 656, 2.2);

  ctx.fillStyle = "rgba(160, 160, 162, 0.9)";
  drawTracked(ctx, "FIG. 01", RIGHT_RIGHT, 656, 2.2, "right");

  hairline(ctx, SPLIT + 24, 604, RIGHT_RIGHT, 604, 0.1);
}

function paintBackBase(ctx: CanvasRenderingContext2D) {
  const base = ctx.createLinearGradient(0, FACE_HEIGHT, FACE_WIDTH, 0);
  base.addColorStop(0, "#050506");
  base.addColorStop(0.42, "#0b0b0d");
  base.addColorStop(0.72, "#101012");
  base.addColorStop(1, "#08080a");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, FACE_WIDTH, FACE_HEIGHT);

  const bloom = ctx.createRadialGradient(230, 60, 10, 230, 60, 700);
  bloom.addColorStop(0, "rgba(255, 255, 255, 0.07)");
  bloom.addColorStop(0.5, "rgba(255, 255, 255, 0.015)");
  bloom.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, FACE_WIDTH, FACE_HEIGHT);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.012)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= FACE_WIDTH; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FACE_HEIGHT);
    ctx.stroke();
  }

  roundedRect(ctx, 28, 28, FACE_WIDTH - 56, FACE_HEIGHT - 56, 18);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const ticks = [
    [28, 28],
    [FACE_WIDTH - 28, 28],
    [28, FACE_HEIGHT - 28],
    [FACE_WIDTH - 28, FACE_HEIGHT - 28],
  ];
  for (const [x, y] of ticks) {
    const dx = x < FACE_WIDTH / 2 ? 1 : -1;
    const dy = y < FACE_HEIGHT / 2 ? 1 : -1;
    hairline(ctx, x + dx * 8, y, x + dx * 30, y, 0.38);
    hairline(ctx, x, y + dy * 8, x, y + dy * 30, 0.38);
  }
}

function paintTechnicalPlate(ctx: CanvasRenderingContext2D, index: string) {
  const cx = 784;
  const cy = 330;
  ctx.save();
  ctx.translate(cx, cy);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 150, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  ctx.arc(0, 0, 112, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.save();
  ctx.rotate(Math.PI / 4);
  ctx.strokeRect(-92, -92, 184, 184);
  ctx.restore();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  hairline(ctx, -196, 0, 196, 0, 0.16);
  hairline(ctx, 0, -196, 0, 196, 0.16);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.26)";
  for (let step = 0; step < 12; step += 1) {
    const angle = (step / 12) * Math.PI * 2;
    const inner = 158;
    const outer = step % 3 === 0 ? 176 : 167;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const x = sx * 218;
      const y = sy * 218;
      hairline(ctx, x, y - sy * 22, x, y, 0.2);
      hairline(ctx, x, y, x - sx * 22, y, 0.2);
    }
  }

  setTracking(ctx, "-8px");
  ctx.font = `600 168px "Inter", "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.58)";
  ctx.lineWidth = 1.6;
  ctx.strokeText(index, 0, 6);
  setTracking(ctx, "0px");

  ctx.restore();
}

function paintBackText(
  ctx: CanvasRenderingContext2D,
  print: CardPrint,
  fonts: CardFonts,
) {
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "rgba(226, 226, 228, 0.92)";
  ctx.font = `400 20px ${fonts.mono}`;
  drawTracked(ctx, "DARVINN STUDIO", LEFT, 98, 2.8);

  ctx.fillStyle = "rgba(153, 153, 155, 0.95)";
  drawTracked(
    ctx,
    `PLATE ${print.index} / ${String(print.total).padStart(2, "0")}`,
    RIGHT_RIGHT,
    98,
    2.6,
    "right",
  );

  hairline(ctx, LEFT, 132, RIGHT_RIGHT, 132, 0.15);

  ctx.fillStyle = "rgba(153, 153, 155, 0.95)";
  ctx.font = `400 22px ${fonts.mono}`;
  drawTracked(ctx, print.category, LEFT, 300, 1.4);

  const lines = print.titleLines.filter((line) => line.trim().length > 0);
  if (lines.length > 0) {
    let size = 88;
    const available = LEFT_RIGHT - LEFT;
    ctx.fillStyle = "#ececee";
    ctx.font = `600 ${size}px ${fonts.sans}`;
    setTracking(ctx, "-3px");
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
    size = Math.min(size, Math.floor((size * available) / widest));
    ctx.font = `600 ${size}px ${fonts.sans}`;
    setTracking(ctx, `${(-size * 0.03).toFixed(2)}px`);
    const lineHeight = size * 1.03;
    const lastBaseline = 482;
    lines.forEach((line, index) => {
      ctx.fillText(
        line,
        LEFT,
        lastBaseline - (lines.length - 1 - index) * lineHeight,
      );
    });
    setTracking(ctx, "0px");
  }

  hairline(ctx, LEFT, 604, LEFT_RIGHT, 604, 0.13);

  ctx.fillStyle = "rgba(138, 138, 140, 0.95)";
  ctx.font = `400 19px ${fonts.mono}`;
  drawTracked(ctx, "STUDIO ARCHIVE", LEFT, 656, 2.2);

  ctx.fillStyle = "rgba(214, 214, 216, 0.9)";
  drawTracked(ctx, "2026", LEFT_RIGHT, 656, 2.6, "right");

  paintTechnicalPlate(ctx, print.index);

  ctx.fillStyle = "rgba(150, 150, 152, 0.9)";
  ctx.font = `400 17px ${fonts.mono}`;
  drawTracked(ctx, "OBJECT INDEX / REVERSE", 784, 566, 2.1, "right");

  const barsLeft = 628;
  const barsWidth = 312;
  BACK_BARS.forEach((height, index) => {
    const x = barsLeft + (index / BACK_BARS.length) * barsWidth;
    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    ctx.fillRect(x, 638 - height, 2, height);
  });

  hairline(ctx, 628, 604, 940, 604, 0.1);
}

export async function buildVortexAtlas(
  prints: CardPrint[],
  options: { tileWidth: number; columns?: number },
): Promise<VortexAtlas> {
  if (typeof document === "undefined") {
    throw new Error("The vortex card atlas requires a browser document.");
  }

  await document.fonts.ready;

  const tileWidth = options.tileWidth;
  const tileHeight = Math.round(tileWidth * (FACE_HEIGHT / FACE_WIDTH));
  const columns = Math.max(
    1,
    Math.min(options.columns ?? prints.length, Math.max(prints.length, 1)),
  );
  const rows = Math.max(1, Math.ceil(prints.length / columns));
  const atlasWidth = columns * tileWidth;
  const atlasHeight = rows * 2 * tileHeight;

  const canvas = document.createElement("canvas");
  canvas.width = atlasWidth;
  canvas.height = atlasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("A 2D canvas context is unavailable.");
  }

  const fonts = getCardFonts();
  const sx = tileWidth / FACE_WIDTH;
  const sy = tileHeight / FACE_HEIGHT;

  prints.forEach((print, slot) => {
    const column = slot % columns;
    const row = Math.floor(slot / columns);
    const x = column * tileWidth;
    const y = row * tileHeight;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    paintFront(ctx, print, slot);
    paintFrontText(ctx, print, fonts);
    ctx.restore();

    ctx.save();
    ctx.translate(x, tileHeight);
    addGrainTo(ctx, tileWidth, tileHeight);
    ctx.restore();
  });

  const backBase = document.createElement("canvas");
  backBase.width = tileWidth;
  backBase.height = tileHeight;
  const backContext = backBase.getContext("2d");
  if (!backContext) {
    throw new Error("A 2D canvas context is unavailable.");
  }
  backContext.save();
  backContext.scale(sx, sy);
  paintBackBase(backContext);
  backContext.restore();

  prints.forEach((print, slot) => {
    const column = slot % columns;
    const row = Math.floor(slot / columns);
    const x = column * tileWidth;
    const y = (rows + row) * tileHeight;

    ctx.drawImage(backBase, x, y);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    paintBackText(ctx, print, fonts);
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    addGrainTo(ctx, tileWidth, tileHeight);
    ctx.restore();
  });

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  const fronts = prints.map((_, slot) => {
    const column = slot % columns;
    const row = Math.floor(slot / columns);
    const u0 = (column * tileWidth) / atlasWidth;
    const u1 = ((column + 1) * tileWidth) / atlasWidth;
    const v1 = 1 - (row * tileHeight) / atlasHeight;
    const v0 = 1 - ((row + 1) * tileHeight) / atlasHeight;
    return { u0, v0, u1, v1 };
  });

  const backs = prints.map((_, slot) => {
    const column = slot % columns;
    const row = Math.floor(slot / columns);
    const u0 = (column * tileWidth) / atlasWidth;
    const u1 = ((column + 1) * tileWidth) / atlasWidth;
    const v1 = 1 - ((rows + row) * tileHeight) / atlasHeight;
    const v0 = 1 - ((rows + row + 1) * tileHeight) / atlasHeight;
    return { u0, v0, u1, v1 };
  });

  return { texture, fronts, backs };
}

export function buildVortexSheenTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 452;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("A 2D canvas context is unavailable.");
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.filter = "blur(22px)";

  ctx.save();
  ctx.translate(470, 130);
  ctx.rotate(0.62);
  const streak = ctx.createLinearGradient(-40, 0, 40, 0);
  streak.addColorStop(0, "rgba(255, 255, 255, 0)");
  streak.addColorStop(0.5, "rgba(255, 255, 255, 0.42)");
  streak.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = streak;
  ctx.fillRect(-40, -230, 80, 460);
  ctx.restore();

  ctx.save();
  ctx.translate(210, 380);
  ctx.rotate(-0.24);
  const lower = ctx.createLinearGradient(-220, 0, 220, 0);
  lower.addColorStop(0, "rgba(255, 255, 255, 0)");
  lower.addColorStop(0.5, "rgba(255, 255, 255, 0.07)");
  lower.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = lower;
  ctx.fillRect(-220, -32, 440, 64);
  ctx.restore();

  ctx.save();
  ctx.translate(110, 90);
  ctx.rotate(0.2);
  const corner = ctx.createLinearGradient(0, -110, 0, 110);
  corner.addColorStop(0, "rgba(255, 255, 255, 0)");
  corner.addColorStop(0.4, "rgba(255, 255, 255, 0.16)");
  corner.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = corner;
  ctx.fillRect(-70, -110, 140, 220);
  ctx.restore();

  ctx.restore();

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
