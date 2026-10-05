"use client";

import { usePaletteScroll } from "@/lib/use-palette-scroll";

/**
 * Root driver for the ambient palette shift. Renders nothing —
 * `usePaletteScroll` owns the ScrollTriggers.
 */
export default function PaletteDriver() {
  usePaletteScroll();
  return null;
}
