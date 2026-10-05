"use client";

import { useEffect, type RefObject } from "react";

type RevealOptions = {
  /** Stagger in seconds between siblings. Defaults to 0.08. */
  stagger?: number;
};

/**
 * One-time section entrance animation (GSAP + ScrollTrigger).
 *
 * When the section enters the viewport (`start: 'top 80%'`), direct
 * descendants matching `[data-reveal]` fade in (`opacity 0 → 1`) and rise
 * (`y 16 → 0`) over 600ms with an 80ms stagger, `power2.out`, once ever.
 *
 * Initial hidden state is applied via `gsap.set` inside the effect only —
 * never in CSS — so content is fully visible with JS disabled or when
 * `prefers-reduced-motion` is set (in which case no ScrollTrigger is
 * initialized at all).
 */
export function useSectionReveal(
  ref: RefObject<HTMLElement | null>,
  options?: RevealOptions,
): void {
  const stagger = options?.stagger ?? 0.08;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = ref.current;
    if (!root) return;

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([gsapMod, stMod]) => {
        if (cancelled || !ref.current) return;
        const gsap = gsapMod.gsap ?? gsapMod.default;
        const ScrollTrigger = stMod.ScrollTrigger ?? stMod.default;
        gsap.registerPlugin(ScrollTrigger);

        const section = ref.current;
        const targets = section.querySelectorAll("[data-reveal]");
        if (targets.length === 0) return;

        const ctx = gsap.context(() => {
          gsap.set(targets, { opacity: 0, y: 16 });
          gsap.to(targets, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              once: true,
            },
          });
        }, section);

        cleanup = () => ctx.revert();
      })
      .catch(() => {
        // GSAP chunk failed to load — content stays visible (gsap.set
        // never ran), so fall back to the static page.
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [ref, stagger]);
}
