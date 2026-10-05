export type Palette = {
  bg: string;
  fg: string;
  accent: string;
  border: string;
};

export type PaletteKey =
  | "shelfsense"
  | "supportai"
  | "leadflow"
  | "fadeandco"
  | "neutral";

/**
 * Project palettes. Sections will shift the page into each project's
 * palette on scroll (wired in a later layer — stub shape only for now).
 */
export const PALETTES: Record<PaletteKey, Palette> = {
  neutral: {
    bg: "#0a0a0b",
    fg: "#f5f5f4",
    accent: "#f5f5f4",
    border: "#1f1f22",
  },
  shelfsense: {
    bg: "#0a1628",
    fg: "#ecfdf5",
    accent: "#10b981",
    border: "#1e3a5f",
  },
  supportai: {
    bg: "#09090b",
    fg: "#f4f4f5",
    accent: "#6366f1",
    border: "#27272a",
  },
  leadflow: {
    bg: "#09090b",
    fg: "#fafaf9",
    accent: "#f59e0b",
    border: "#27272a",
  },
  fadeandco: {
    bg: "#f6f1e7",
    fg: "#211812",
    accent: "#c99a3c",
    border: "#dcd2be",
  },
};
