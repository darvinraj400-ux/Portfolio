export type RGB = [number, number, number];

export type Palette = {
  bg: RGB;
  fg: RGB;
  accent: RGB;
  accentForeground: RGB;
  border: RGB;
  muted: RGB;
  mutedForeground: RGB;
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
    accentForeground: [10, 10, 11],
    border: [31, 31, 34],
    muted: [161, 161, 170],
    mutedForeground: [161, 161, 170],
  },
  shelfsense: {
    bg: [6, 17, 31],
    fg: [224, 242, 254],
    accent: [16, 185, 129],
    accentForeground: [6, 17, 31],
    border: [14, 42, 61],
    muted: [148, 163, 184],
    mutedForeground: [161, 161, 170],
  },
  supportai: {
    bg: [9, 9, 11],
    fg: [250, 250, 250],
    accent: [84, 88, 228],
    accentForeground: [250, 250, 250],
    border: [39, 39, 42],
    muted: [161, 161, 170],
    mutedForeground: [161, 161, 170],
  },
  leadflow: {
    bg: [10, 10, 11],
    fg: [245, 245, 244],
    accent: [245, 158, 11],
    accentForeground: [10, 10, 11],
    border: [39, 39, 42],
    muted: [161, 161, 170],
    mutedForeground: [161, 161, 170],
  },
  fadeandco: {
    bg: [245, 241, 234],
    fg: [28, 25, 23],
    accent: [180, 83, 9],
    accentForeground: [255, 252, 245],
    border: [231, 222, 209],
    muted: [102, 96, 91],
    mutedForeground: [92, 86, 81],
  },
};
