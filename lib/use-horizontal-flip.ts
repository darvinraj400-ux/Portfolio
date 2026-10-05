"use client";

import { useEffect, type RefObject } from "react";
import { setActivePalette } from "./active-palette";
import { getLenisInstance, scrollToId } from "./scroll";

type FlipOptions = {
  /** Selector for cards inside the track. Defaults to "[data-card]". */
  cardSelector?: string;
};

// True while the Flip's pin trigger is actively pinning. Read by
// use-palette-scroll so the vertical card triggers yield to the Flip
// only during the pin (not merely when it exists).
let flipPinActive = false;

export function isFlipPinActive(): boolean {
  return flipPinActive;
}

/**
 * Horizontal Flip for the Products section (desktop only).
 *
 * Pins the section (`top top`, 1:1 scrub) and translates the track
 * horizontally across the project cards. The centered card (within
 * 25vw of viewport center and vertically on screen) gets
 * `data-centered="true"` and drives `setActivePalette` — same Layer-3
 * entry point, only the trigger differs. Leaving the pin forward
 * returns to neutral; gap zones hold the last palette by design.
 *
 * Mobile (<1024px) and `prefers-reduced-motion` render the normal
 * vertical stack: no trigger is created and all cards stay centered
 * (details visible via CSS default). The horizontal layout itself is
 * gated on `html.js-flip` (set here on setup), so no-JS and GSAP-load
 * failure also fall back to the stack.
 *
 * Coexists with the vertical Layer-3 triggers untouched: while pinned
 * those triggers yield (see use-palette-scroll); on approach and
 * reverse they drive normally.
 */
export function useHorizontalFlip(
  pinRef: RefObject<HTMLElement | null>,
  trackRef: RefObject<HTMLElement | null>,
  opts?: FlipOptions,
): void {
  const selector = opts?.cardSelector ?? "[data-card]";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pin = pinRef.current;
    const track = trackRef.current;
    if (!pin || !track) return;

    const mqDesktop = window.matchMedia("(min-width: 1024px)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const flipActive = () => mqDesktop.matches && !mqMotion.matches;

    let cancelled = false;
    // Generation guards the setup/teardown race: only the latest
    // generation may install a trigger.
    let generation = 0;
    let cleanup: (() => void) | null = null;
    let refreshFn: (() => void) | null = null;

    const setAllCentered = (value: boolean) => {
      track.querySelectorAll(selector).forEach((el) => {
        el.setAttribute("data-centered", String(value));
      });
    };

    const setup = () => {
      if (cancelled || cleanup) return;
      const gen = ++generation;
      // Horizontal layout applies immediately; the pin follows once
      // GSAP loads. Removed on teardown/failure → vertical stack.
      document.documentElement.classList.add("js-flip");
      void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
        .then(([gsapMod, stMod]) => {
          if (cancelled || gen !== generation || !flipActive()) return;
          const gsap = gsapMod.gsap ?? gsapMod.default;
          const ScrollTrigger = stMod.ScrollTrigger ?? stMod.default;
          gsap.registerPlugin(ScrollTrigger);

          const distance = () =>
            Math.max(0, track.scrollWidth - window.innerWidth);
          let centered: HTMLElement | null = null;
          // Live pin range for the Escape handler; synced on refresh.
          let range: { start: number; end: number } | null = null;

          const updateCentered = () => {
            const cards = Array.from(
              track.querySelectorAll<HTMLElement>(selector),
            );
            if (cards.length === 0) return;
            const vh = window.innerHeight;
            const mid = window.innerWidth / 2;
            const band = window.innerWidth * 0.25;
            let best: HTMLElement | null = null;
            let bestDelta = Infinity;
            for (const card of cards) {
              const rect = card.getBoundingClientRect();
              // Horizontal center alone is not enough: far above/below
              // the fold the first/last card would otherwise win and
              // repaint the hero in a project palette on load.
              const vc = rect.top + rect.height / 2;
              if (vc < vh * 0.2 || vc > vh * 0.8) continue;
              const delta = Math.abs(rect.left + rect.width / 2 - mid);
              if (delta < bestDelta) {
                bestDelta = delta;
                best = card;
              }
            }
            // Gap zones hold the last palette — no call, no toggle.
            if (!best || bestDelta > band || best === centered) return;
            centered = best;
            for (const card of cards) {
              card.setAttribute(
                "data-centered",
                String(card === best),
              );
            }
            if (best.dataset.palette) {
              setActivePalette(best.dataset.palette);
            }
          };

          const onFocusIn = (e: FocusEvent) => {
            if (!range) return;
            const target = e.target as HTMLElement | null;
            // Keyboard focus only: pointer clicks on peeked cards must
            // not yank the whole pin.
            if (!target?.matches?.(":focus-visible")) return;
            const card = target.closest?.(selector) as HTMLElement | null;
            if (!card || !track.contains(card)) return;
            // 1px of vertical scroll maps to 1px of horizontal travel,
            // so shifting scroll by the centering delta centers the card.
            const rect = card.getBoundingClientRect();
            const delta =
              rect.left + rect.width / 2 - window.innerWidth / 2;
            if (Math.abs(delta) < window.innerWidth * 0.25) return;
            const y = Math.min(
              range.end,
              Math.max(range.start, window.scrollY + delta),
            );
            const lenis = getLenisInstance();
            if (lenis) lenis.scrollTo(y);
            else window.scrollTo({ top: y, behavior: "smooth" });
          };

          const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Escape" || !range) return;
            const y = window.scrollY;
            if (y < range.start || y > range.end) return;
            // Only exit when focus is inside the pin (or nowhere in
            // particular) — a focused nav link keeps its own Escape.
            const ae = document.activeElement;
            if (ae && ae !== document.body && !pin.contains(ae)) return;
            // Drop focus first: otherwise the browser may snap-scroll
            // back to reveal the focused card link mid-flight.
            if (ae instanceof HTMLElement) ae.blur();
            scrollToId("services");
          };

          const ctx = gsap.context(() => {
            gsap.to(track, {
              x: () => -distance(),
              ease: "none",
              // NOTE: center detection lives on the TWEEN's onUpdate, not
              // the ScrollTrigger's. With scrub smoothing the track keeps
              // traveling after the scroll position settles; trigger
              // onUpdate would evaluate stale (pre-catch-up) geometry.
              // Tween onUpdate fires every render tick, so the centered
              // card always matches what is actually on screen.
              onUpdate: () => updateCentered(),
              scrollTrigger: {
                trigger: pin,
                start: "top top",
                end: () => `+=${distance()}`,
                pin: true,
                scrub: 1,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onToggle: (self) => {
                  flipPinActive = self.isActive;
                },
                onLeave: () => setActivePalette("neutral"),
                // Reverse exit defers to the Layer-3 vertical triggers,
                // which re-fire as Featured re-enters its band.
                onRefresh: (self) => {
                  range = { start: self.start, end: self.end };
                  updateCentered();
                },
              },
            });
            track.addEventListener("focusin", onFocusIn);
            window.addEventListener("keydown", onKeyDown);
            updateCentered();
          }, pin);

          refreshFn = () => ScrollTrigger.refresh();
          // Pinning inserts a spacer that grows the document: refresh
          // Lenis's cached dimensions so long scrollTo() targets below
          // the pin stay reachable. (If Lenis mounts later it measures
          // fresh, so either order ends correct.)
          getLenisInstance()?.resize?.();

          cleanup = () => {
            track.removeEventListener("focusin", onFocusIn);
            window.removeEventListener("keydown", onKeyDown);
            flipPinActive = false;
            range = null;
            centered = null;
            ctx.revert();
          };
        })
        .catch(() => {
          // GSAP chunk failed — vertical stack stays, details visible.
          document.documentElement.classList.remove("js-flip");
          setAllCentered(true);
        });
    };

    const teardown = () => {
      generation++;
      cleanup?.();
      cleanup = null;
      // Spacer removed → document shrank: refresh remaining triggers
      // (vertical palette + reveals) and Lenis's cached limit.
      refreshFn?.();
      refreshFn = null;
      document.documentElement.classList.remove("js-flip");
      // ctx.revert() (inside cleanup) restores the track transform when
      // a tween exists; clear inline style as well for the never-setup
      // case, then refresh dependents of the shrunken document.
      track.style.transform = "";
      setAllCentered(true);
      getLenisInstance()?.resize?.();
    };

    const onMediaChange = () => {
      if (flipActive()) {
        if (!cleanup) setup();
      } else {
        teardown();
      }
    };

    if (flipActive()) {
      setup();
    } else {
      setAllCentered(true);
    }
    mqDesktop.addEventListener("change", onMediaChange);
    mqMotion.addEventListener("change", onMediaChange);

    return () => {
      cancelled = true;
      mqDesktop.removeEventListener("change", onMediaChange);
      mqMotion.removeEventListener("change", onMediaChange);
      teardown();
    };
  }, [pinRef, trackRef, selector]);
}
