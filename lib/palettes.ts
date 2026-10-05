export type RGB = [number, number, number];

export type Palette = {
  bg: RGB;
  fg: RGB;
  accent: RGB;
  border: RGB;
  muted: RGB;
};

export type PaletteKey =
  | "shelfsense"
  | "supportai"
  | "leadflow"
  | "fadeandco"
  | "neutral";

/**
 * Project palettes as RGB triplets so GSAP can interpolate them
 * numerically frame-by-frame (see lib/active-palette.ts).
 *
 * `fadeandco` is LIGHT — when active the page inverts to cream.
 */
export const PALETTES: Record<PaletteKey, Palette> = {
  neutral: {
    bg: [10, 10, 11],
    fg: [245, 245, 244],
    accent: [245, 245, 244],
    border: [31, 31, 34],
    muted: [161, 161, 170],
  },
  shelfsense: {
    bg: [6, 17, 31],
    fg: [224, 242, 254],
    accent: [16, 185, 129],
    border: [14, 42, 61],
    muted: [148, 163, 184],
  },
  supportai: {
    bg: [9, 9, 11],
    fg: [250, 250, 250],
    accent: [99, 102, 241],
    border: [39, 39, 42],
    muted: [161, 161, 170],
  },
  leadflow: {
    bg: [10, 10, 11],
    fg: [245, 245, 244],
    accent: [245, 158, 11],
    border: [39, 39, 42],
    muted: [161, 161, 170],
  },
  fadeandco: {
    bg: [245, 241, 234],
    fg: [28, 25, 23],
    accent: [180, 83, 9],
    border: [231, 222, 209],
    muted: [120, 113, 108],
  },
};
