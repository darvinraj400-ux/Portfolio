/**
 * GSAP + ScrollTrigger + Lenis wiring.
 *
 * Layer 2: shared Lenis instance + scrollToId. Palette-shift scroll
 * animations land in a later layer.
 */

export type LenisLike = {
  scrollTo: (
    target: string | number | HTMLElement,
    options?: { offset?: number; immediate?: boolean },
  ) => void;
  raf: (time: number) => void;
  resize?: () => void;
  destroy: () => void;
};

let lenisInstance: LenisLike | null = null;

export function setLenisInstance(lenis: LenisLike | null): void {
  lenisInstance = lenis;
}

export function getLenisInstance(): LenisLike | null {
  return lenisInstance;
}

export function initScrollAnimations(): () => void {
  // TODO (later layer): register GSAP ScrollTrigger and tween
  // `--background` / `--foreground` / `--accent` per section palette.
  return () => {};
}

/** Height of the sticky nav (h-14), mirrored by scroll-mt-14 on sections. */
const NAV_OFFSET = -56;

export function scrollToId(id: string): void {
  if (typeof document === "undefined") return;
  const target = id.startsWith("#") ? id.slice(1) : id;
  const el = document.getElementById(target);
  if (!el) return;

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const lenis = getLenisInstance();
  if (lenis && !reduceMotion) {
    lenis.scrollTo(el, { offset: NAV_OFFSET });
    return;
  }

  if (reduceMotion) {
    el.scrollIntoView({ behavior: "auto", block: "start" });
  } else {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
