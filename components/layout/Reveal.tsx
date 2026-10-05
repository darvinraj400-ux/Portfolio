"use client";

import { useRef, type ReactNode } from "react";
import { useSectionReveal } from "@/lib/use-section-reveal";

/**
 * Client wrapper that runs the one-time section reveal on its
 * `[data-reveal]` descendants. Lets sections stay server components —
 * content is fully visible until the GSAP effect sets initial state.
 */
export default function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useSectionReveal(ref);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
