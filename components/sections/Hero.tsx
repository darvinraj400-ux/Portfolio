"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { SITE } from "@/lib/constants";

const CHAR_DURATION = 0.38;
const CHAR_STAGGER = 0.022;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SUBLINE_DELAY = 0.9;

const h1ClassName =
  "font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl";

/**
 * Hero with a one-time character decode on the h1.
 *
 * SSR (and the first client render) output the full positioning string as
 * plain text, so SEO, screen readers, and no-JS clients see it complete.
 * After mount — unless `prefers-reduced-motion` is set — the string is
 * split into per-character spans that fade/slide in with a stagger.
 * Runs once on mount, never repeats.
 */
export default function Hero() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAnimate(true);
  }, []);

  const text = SITE.positioning;
  const chars = Array.from(text);

  return (
    <section
      id="top"
      aria-label="Introduction"
      className="flex min-h-[calc(100svh-3.5rem)] flex-col justify-center px-6"
    >
      <div className="mx-auto w-full max-w-5xl">
        {animate ? (
          <h1 aria-label={text} className={h1ClassName}>
            {chars.map((char, i) =>
              char === " " ? (
                // Plain space: keeps a line-break opportunity so the h1
                // wraps on narrow viewports (nbsp would lock one long line).
                " "
              ) : (
                <motion.span
                  key={i}
                  aria-hidden="true"
                  className="inline-block"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * CHAR_STAGGER,
                    duration: CHAR_DURATION,
                    ease: EASE,
                  }}
                >
                  {char}
                </motion.span>
              ),
            )}
          </h1>
        ) : (
          <h1 className={h1ClassName}>{text}</h1>
        )}
        {animate ? (
          <motion.p
            className="mt-6 text-base text-muted-foreground sm:text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: SUBLINE_DELAY, duration: 0.5 }}
          >
            Darvin Raj — full-stack engineer based in Kuala Lumpur.
          </motion.p>
        ) : (
          <p className="mt-6 text-base text-muted-foreground sm:text-lg">
            Darvin Raj — full-stack engineer based in Kuala Lumpur.
          </p>
        )}
        {animate ? (
          <motion.p
            className="mt-16 flex items-center gap-2 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: SUBLINE_DELAY, duration: 0.5 }}
          >
            {/* Sanctioned exception to one-time-only: the scroll cue is the
                single looping animation on the page (2s reverse cycle). */}
            <motion.span
              className="inline-flex"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            >
              <ArrowDown className="size-4" aria-hidden="true" />
            </motion.span>
            Scroll
          </motion.p>
        ) : (
          <p className="mt-16 flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowDown className="size-4" aria-hidden="true" />
            Scroll
          </p>
        )}
      </div>
    </section>
  );
}
