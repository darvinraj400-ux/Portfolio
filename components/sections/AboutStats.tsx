"use client";

import { useEffect, useState } from "react";
import { NumberTicker } from "@/components/ui/number-ticker";

const STATS = [
  { value: 3, label: "Live projects" },
  { value: 4, label: "AI patterns in production" },
  { value: 1, label: "Registered copyright" },
] as const;

const NUMBER_CLASS =
  "font-serif text-5xl tracking-tight text-foreground tabular-nums sm:text-6xl";

/**
 * About credibility stats. Numbers count up once when scrolled into
 * view (NumberTicker handles in-view-once internally); reduced-motion
 * renders the final values as plain text from first paint. Without JS,
 * the ticker spans stay at their start values and the <noscript>
 * finals below take over instead.
 */
export default function AboutStats() {
  // Initial false matches SSR so hydration agrees; the effect swaps in
  // static finals for reduced-motion before it matters (stats sit
  // below the fold).
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="mt-16 grid gap-10 sm:grid-cols-3">
      {STATS.map((stat) => (
        <div key={stat.label} data-reveal>
          {reducedMotion ? (
            <span className={NUMBER_CLASS}>{stat.value}</span>
          ) : (
            <NumberTicker
              value={stat.value}
              delay={0.3}
              className={`${NUMBER_CLASS} about-ticker-js`}
            />
          )}
          <noscript>
            <span className={NUMBER_CLASS}>{stat.value}</span>
          </noscript>
          <p className="mt-3 text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
      <noscript>
        <style>{".about-ticker-js{display:none}"}</style>
      </noscript>
    </div>
  );
}
