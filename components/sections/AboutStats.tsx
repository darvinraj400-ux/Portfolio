"use client";

import { NumberTicker } from "@/components/ui/number-ticker";
import ScrambleText from "@/components/motion/ScrambleText";
import {
  PROJECT_CATEGORY_COUNTS,
  PROJECT_COUNT,
} from "@/lib/projects";

const NUMBER_CLASS =
  "text-4xl font-medium tracking-tight text-paper tabular-nums sm:text-5xl";

/**
 * Collection statistics, derived from the central project inventory.
 * Numbers count up once when scrolled into view; reduced motion renders
 * the final values immediately.
 */
export default function AboutStats() {
  return (
    <dl className="mt-16 border-t border-line">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5 py-8">
        <div className="flex flex-col-reverse gap-3">
          <dt className="mono-meta text-ash">
            <ScrambleText
              text="Selected projects"
              level="micro"
              trigger="view"
            />
          </dt>
          <dd>
            <NumberTicker
              value={PROJECT_COUNT}
              delay={0.15}
              className="text-6xl font-medium tracking-tight text-paper tabular-nums sm:text-7xl"
            />
          </dd>
        </div>
        <ScrambleText
          as="p"
          className="mono-meta max-w-[18rem] leading-relaxed text-ash sm:text-right"
          text="Design concepts, functional demonstrations and deployed products."
          level="body"
          trigger="view"
          delay={60}
        />
      </div>

      <div className="grid border-t border-line sm:grid-cols-2">
        {PROJECT_CATEGORY_COUNTS.map((category, index) => (
          <div
            key={category.id}
            className={[
              "flex flex-col-reverse gap-2 border-line py-6",
              index > 0 ? "border-t" : "",
              index % 2 === 1 ? "sm:border-l sm:pl-8" : "sm:pr-8",
              index < 2 ? "sm:border-t-0" : "sm:border-t",
            ].join(" ")}
          >
            <dt className="mono-meta text-ash">
              <ScrambleText
                text={category.label}
                level="micro"
                trigger="view"
                delay={index * 40}
              />
            </dt>
            <dd>
              <NumberTicker
                value={category.count}
                delay={0.3}
                className={NUMBER_CLASS}
              />
            </dd>
          </div>
        ))}
      </div>
    </dl>
  );
}
