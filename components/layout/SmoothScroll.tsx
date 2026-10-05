"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { setLenisInstance, type LenisLike } from "@/lib/scroll";

/**
 * Initializes Lenis smooth scrolling on mount, tears down on unmount.
 * Returns children only.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
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
  }, []);

  return <>{children}</>;
}
