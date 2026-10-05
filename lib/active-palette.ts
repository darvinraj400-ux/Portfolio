"use client";

import { PALETTES, type Palette, type PaletteKey, type RGB } from "./palettes";

type PaletteState = {
  bg: RGB;
  fg: RGB;
  accent: RGB;
  accentForeground: RGB;
  border: RGB;
  muted: RGB;
  mutedForeground: RGB;
};

const TOKEN_VARS = {
  bg: "--background-rgb",
  fg: "--foreground-rgb",
  accent: "--accent-rgb",
  accentForeground: "--accent-foreground-rgb",
  border: "--border-rgb",
  muted: "--muted-rgb",
  mutedForeground: "--muted-foreground-rgb",
} as const;

const TOKEN_ENTRIES = Object.entries(TOKEN_VARS) as [
  keyof typeof TOKEN_VARS,
  (typeof TOKEN_VARS)[keyof typeof TOKEN_VARS],
][];

function clone(p: Palette): PaletteState {
  return {
    bg: [...p.bg],
    fg: [...p.fg],
    accent: [...p.accent],
    accentForeground: [...p.accentForeground],
    border: [...p.border],
    muted: [...p.muted],
    mutedForeground: [...p.mutedForeground],
  };
}

function rgb(r: number, g: number, b: number): RGB {
  return [r, g, b];
}

function writeTokens(state: PaletteState): void {
  const root = document.documentElement;
  for (const [key, variable] of TOKEN_ENTRIES) {
    const [r, g, b] = state[key];
    root.style.setProperty(
      variable,
      `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`,
    );
  }
}

function resolveKey(key: string): PaletteKey {
  return Object.hasOwn(PALETTES, key) ? (key as PaletteKey) : "neutral";
}

// Seeded from neutral to match the CSS defaults in app/globals.css.
let currentKey: PaletteKey = "neutral";
let current: PaletteState = clone(PALETTES.neutral);
let tween: { kill: () => void } | null = null;

/**
 * Single entry point for the ambient palette shift.
 *
 * Animates the page tokens toward `key` over ~1.2s (power2.inOut).
 * Same-key calls no-op; retriggers kill the in-flight tween so rapid
 * scrolling never queues animations. Unknown keys fall back to neutral.
 * `prefers-reduced-motion` sets tokens instantly with no tween.
 *
 * Layer 4's horizontal Flip will call this same function — only the
 * triggers change, never this mechanism.
 */
export function setActivePalette(
  key: string,
  opts?: { duration?: number },
): void {
  if (typeof document === "undefined") return;
  const target = resolveKey(key);
  if (target === currentKey) return;

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const applyInstant = () => {
    tween?.kill();
    tween = null;
    current = clone(PALETTES[target]);
    currentKey = target;
    writeTokens(current);
  };

  if (reduceMotion) {
    applyInstant();
    return;
  }

  const duration = opts?.duration ?? 1.2;
  const from = clone(current);
  const to = PALETTES[target];
  // Mark active up-front: same-key calls during the flight no-op and
  // converge on this target instead of restarting the tween.
  currentKey = target;
  // Null the handle at kill time so non-null always means a live tween.
  tween?.kill();
  tween = null;

  void import("gsap")
    .then((gsapMod) => {
      // A newer call may have superseded this one while loading.
      if (currentKey !== target) return;
      const gsap = gsapMod.gsap ?? gsapMod.default;
      // Flat per-channel proxy: GSAP's types only accept scalar
      // number|string end values (arrays tween fine at runtime, but
      // keep this type-clean instead of casting).
      const proxy = {
        bg0: from.bg[0],
        bg1: from.bg[1],
        bg2: from.bg[2],
        fg0: from.fg[0],
        fg1: from.fg[1],
        fg2: from.fg[2],
        ac0: from.accent[0],
        ac1: from.accent[1],
        ac2: from.accent[2],
        af0: from.accentForeground[0],
        af1: from.accentForeground[1],
        af2: from.accentForeground[2],
        bo0: from.border[0],
        bo1: from.border[1],
        bo2: from.border[2],
        mu0: from.muted[0],
        mu1: from.muted[1],
        mu2: from.muted[2],
        mf0: from.mutedForeground[0],
        mf1: from.mutedForeground[1],
        mf2: from.mutedForeground[2],
      };
      const readProxy = (): PaletteState => ({
        bg: rgb(proxy.bg0, proxy.bg1, proxy.bg2),
        fg: rgb(proxy.fg0, proxy.fg1, proxy.fg2),
        accent: rgb(proxy.ac0, proxy.ac1, proxy.ac2),
        accentForeground: rgb(proxy.af0, proxy.af1, proxy.af2),
        border: rgb(proxy.bo0, proxy.bo1, proxy.bo2),
        muted: rgb(proxy.mu0, proxy.mu1, proxy.mu2),
        mutedForeground: rgb(proxy.mf0, proxy.mf1, proxy.mf2),
      });
      tween = gsap.to(proxy, {
        bg0: to.bg[0],
        bg1: to.bg[1],
        bg2: to.bg[2],
        fg0: to.fg[0],
        fg1: to.fg[1],
        fg2: to.fg[2],
        ac0: to.accent[0],
        ac1: to.accent[1],
        ac2: to.accent[2],
        af0: to.accentForeground[0],
        af1: to.accentForeground[1],
        af2: to.accentForeground[2],
        bo0: to.border[0],
        bo1: to.border[1],
        bo2: to.border[2],
        mu0: to.muted[0],
        mu1: to.muted[1],
        mu2: to.muted[2],
        mf0: to.mutedForeground[0],
        mf1: to.mutedForeground[1],
        mf2: to.mutedForeground[2],
        duration,
        ease: "power2.inOut",
        overwrite: true,
        onUpdate: () => {
          current = readProxy();
          writeTokens(current);
        },
        onComplete: () => {
          tween = null;
          current = clone(to);
          writeTokens(current);
        },
      });
    })
    .catch(() => {
      // GSAP chunk failed — land on the target palette instantly, but
      // only if no newer call superseded this one while loading.
      if (currentKey !== target) return;
      applyInstant();
    });
}

export function getActivePaletteKey(): PaletteKey {
  return currentKey;
}
