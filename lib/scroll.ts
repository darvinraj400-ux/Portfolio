/**
 * GSAP + ScrollTrigger + Lenis wiring.
 *
 * Shared Lenis instance + scrollToId for in-page navigation. Reduced
 * motion bypasses both: the browser scrolls instantly instead.
 */

import { prefersReducedMotion } from "@/lib/motion";

export type LenisLike = {
  scrollTo: (
    target: string | number | HTMLElement,
    options?: { offset?: number; immediate?: boolean },
  ) => void;
  raf: (time: number) => void;
  resize?: () => void;
  stop?: () => void;
  start?: () => void;
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
  return () => {};
}

/** Height of the sticky nav (h-16), mirrored by scroll-mt-16 on sections. */
const NAV_OFFSET = -64;

export function scrollToId(id: string): void {
  if (typeof document === "undefined") return;
  const target = id.startsWith("#") ? id.slice(1) : id;
  const el = document.getElementById(target);
  if (!el) return;

  const lenis = getLenisInstance();
  if (lenis && !prefersReducedMotion()) {
    lenis.scrollTo(el, { offset: NAV_OFFSET });
    return;
  }

  el.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
}
