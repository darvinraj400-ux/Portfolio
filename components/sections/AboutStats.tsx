"use client";

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
 * view (NumberTicker handles in-view-once internally). Without JS,
 * the ticker spans stay at their start values.
 */
export default function AboutStats() {
  return (
    <div className="mt-16 grid gap-10 sm:grid-cols-3">
      {STATS.map((stat) => (
        <div key={stat.label} data-reveal>
          <NumberTicker
            value={stat.value}
            delay={0.3}
            className={NUMBER_CLASS}
          />
          <p className="mt-3 text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
