"use client";

import { useEffect } from "react";
import { setActivePalette } from "./active-palette";
import { isFlipPinActive } from "./use-horizontal-flip";

/**
 * Drives the ambient palette shift from vertical scroll position.
 *
 * One ScrollTrigger per `[data-palette]` element (`start: 'top 45%'`,
 * `end: 'bottom 45%'`); when an element owns the middle band it calls
 * `setActivePalette` with its key. Scrolling back above the first
 * element returns to neutral.
 *
 * Trigger-agnostic by design: Layer 4's horizontal Flip will call
 * `setActivePalette` from horizontal position instead — this hook
 * stays as the vertical driver.
 *
 * Band policy (also for Layer 4): bands must not overlap — when several
 * triggers are active at once, last-toggle-wins. Gaps between bands
 * (e.g. between Product cards) keep the last palette by design; the
 * shift is continuous, not a blend.
 *
 * Reduced-motion: no triggers; neutral is set once on mount.
 */
export function usePaletteScroll(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActivePalette("neutral");
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([gsapMod, stMod]) => {
        if (cancelled) return;
        const gsap = gsapMod.gsap ?? gsapMod.default;
        const ScrollTrigger = stMod.ScrollTrigger ?? stMod.default;
        gsap.registerPlugin(ScrollTrigger);

        const elements = Array.from(
          document.querySelectorAll<HTMLElement>("[data-palette]"),
        );
        if (elements.length === 0) return;

        // While the Products Flip owns the pin, the card wrappers'
        // vertical bands are stale (their document positions no longer
        // track the viewport), so their toggles yield to the Flip's
        // center detection. Outside the pin — approach, mobile stack,
        // reduced motion — they drive normally.
        const flipOwns = (el: HTMLElement): boolean =>
          !!el.closest("#products") && isFlipPinActive();

        const triggers = elements.map((el, index) => {
          const key = el.dataset.palette ?? "neutral";
          return ScrollTrigger.create({
            trigger: el,
            start: "top 45%",
            end: "bottom 45%",
            onToggle: (self) => {
              if (self.isActive && !flipOwns(el)) setActivePalette(key);
            },
            onLeaveBack:
              index === 0 ? () => setActivePalette("neutral") : undefined,
          });
        });

        // Tail fallback: short viewports can clamp at max scroll before
        // the footer/Contact band activates — settle neutral at the very
        // bottom instead of resting on the last card's palette.
        const onBottom = () => {
          if (
            window.scrollY + window.innerHeight >=
            document.documentElement.scrollHeight - 2
          ) {
            setActivePalette("neutral");
          }
        };
        window.addEventListener("scroll", onBottom, { passive: true });

        cleanup = () => {
          triggers.forEach((t) => t.kill());
          window.removeEventListener("scroll", onBottom);
        };
      })
      .catch(() => {
        // GSAP chunk failed — page stays on the neutral base palette.
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
}
