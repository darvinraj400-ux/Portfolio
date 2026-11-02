"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import ScrambleText, { ScrambleGroup } from "@/components/motion/ScrambleText";

const played = new Set<string>();

type PlateState = "rest" | "waiting" | "playing";

export default function SectionFrame({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: string;
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const sectionRef = useRef<HTMLElement>(null);
  const [plate, setPlate] = useState<PlateState>("rest");

  useEffect(() => {
    const key = `${pathname}#${id}`;
    if (played.has(key)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      played.add(key);
      return;
    }
    const node = sectionRef.current;
    if (!node) return;

    if (node.getBoundingClientRect().top <= window.innerHeight * 0.88) {
      played.add(key);
      setPlate("playing");
      return;
    }

    setPlate("waiting");
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        played.add(key);
        setPlate("playing");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [id, pathname]);

  return (
    <ScrambleGroup active={plate === "playing"}>
      <section
        ref={sectionRef}
        id={id}
        aria-labelledby={`${id}-heading`}
        data-plate={plate}
        className="plate-section scroll-mt-16 border-t border-line"
      >
        <div className="shell grid grid-cols-1 gap-8 py-20 lg:grid-cols-12 lg:gap-10 lg:py-28">
          <header className="min-w-0 lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <div className="flex items-baseline gap-4">
                <span aria-hidden="true" className="mono-meta text-ash">
                  {index}
                </span>
                <h2
                  id={`${id}-heading`}
                  className="text-sm font-medium tracking-tight text-silver"
                >
                  <ScrambleText
                    className="plate-label"
                    text={title}
                    level="heading"
                  />
                </h2>
              </div>
              <span
                aria-hidden="true"
                className="plate-rule mt-3 block h-px w-full bg-line"
              />
            </div>
          </header>
          <div className="plate-body min-w-0 lg:col-span-9">{children}</div>
        </div>
      </section>
    </ScrambleGroup>
  );
}
