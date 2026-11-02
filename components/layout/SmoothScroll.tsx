"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import { setLenisInstance, type LenisLike } from "@/lib/scroll";

/**
 * Initializes Lenis smooth scrolling only when the visitor has not asked
 * for reduced motion. Changing the preference tears the instance down and
 * hands scrolling back to the browser.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const { reduced } = useMotionPreference();

  useEffect(() => {
    if (reduced) {
      setLenisInstance(null);
      return;
    }

    let raf = 0;
    let lenis: LenisLike | null = null;
    let cancelled = false;

    void import("lenis")
      .then((mod) => {
        if (cancelled) return;
        const Lenis = mod.default;
        lenis = new Lenis({ duration: 1.1, smoothWheel: true });
        setLenisInstance(lenis);
        const loop = (time: number) => {
          lenis?.raf(time);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      })
      .catch(() => {
        // Lenis chunk failed to load — fall back to native scrolling.
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
      setLenisInstance(null);
      lenis = null;
    };
  }, [reduced]);

  return <>{children}</>;
}
