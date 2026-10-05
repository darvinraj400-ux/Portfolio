"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { SITE } from "@/lib/constants";

const CHAR_DURATION = 0.38;
const CHAR_STAGGER = 0.022;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SUBLINE_DELAY = 0.9;

const h1ClassName =
  "font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl";

const SUBLINE = "Just a dev who ships.";

/**
 * Hero with a one-time character decode on the h1.
 *
 * SSR (and the first client render) output the full positioning string as
 * plain text, so SEO, screen readers, and no-JS clients see it complete.
 * After mount the string is split into per-character spans that fade/slide
 * in with a stagger. Runs once on mount, never repeats.
 */
export default function Hero() {
  const [animate, setAnimate] = useState(false);
  const [decodeComplete, setDecodeComplete] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);

  const text = SITE.positioning;
  const chars = Array.from(text);

  useEffect(() => {
    setAnimate(true);
    // Gate parallax until ALL mount motion is done: the h1 decode
    // ((chars-1) stagger steps + one char duration) and the subline
    // fade (delay + duration), so gsap never shares a node with motion
    // mid-tween. Buffer covers commit-to-paint.
    const decodeMs = (chars.length - 1) * CHAR_STAGGER * 1000 + CHAR_DURATION * 1000;
    const sublineMs = (SUBLINE_DELAY + 0.5) * 1000;
    const timer = window.setTimeout(
      () => setDecodeComplete(true),
      Math.max(decodeMs, sublineMs) + 100,
    );
    return () => window.clearTimeout(timer);
  }, [chars.length]);

  // Parallax drift: headline/subline lag behind the scroll as the hero
  // exits. Gated on decode completion so mid-decode scrolling never
  // fights the character animation; mobile-lean offsets handled inside.
  useEffect(() => {
    if (!animate || !decodeComplete) return;
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const subline = sublineRef.current;
    if (!section || !headline || !subline) return;

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([gsapMod, stMod]) => {
        if (cancelled) return;
        const gsap = gsapMod.gsap ?? gsapMod.default;
        const ScrollTrigger = stMod.ScrollTrigger ?? stMod.default;
        gsap.registerPlugin(ScrollTrigger);

          const ctx = gsap.context(() => {
            // Manual gsap.set (not a bound tween), so no scrub smoothing
            // to configure — values track scroll position directly.
            ScrollTrigger.create({
              trigger: section,
              start: "top top",
              end: "bottom top",
              onUpdate: (self) => {
              const p = self.progress;
              const mobile = window.innerWidth < 768;
              const head = mobile ? -40 : -80;
              const sub = mobile ? -60 : -120;
              gsap.set(headline, { y: p * head });
              gsap.set(subline, { y: p * sub });
            },
          });
        }, section);

        cleanup = () => ctx.revert();
      })
      .catch(() => {
        // GSAP chunk failed — hero scrolls normally, no parallax.
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [animate, decodeComplete]);

  return (
    <section
      id="top"
      aria-label="Introduction"
      ref={sectionRef}
      className="flex min-h-[calc(100svh-3.5rem)] flex-col justify-center px-6"
    >
      <div className="mx-auto w-full max-w-5xl">
        {animate ? (
          <h1 aria-label={text} ref={headlineRef} className={h1ClassName}>
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
          <h1 ref={headlineRef} className={h1ClassName}>{text}</h1>
        )}
        {animate ? (
          <motion.p
            ref={sublineRef}
            className="mt-6 text-base text-muted-foreground sm:text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: SUBLINE_DELAY, duration: 0.5 }}
          >
            {SUBLINE}
          </motion.p>
        ) : (
          <p ref={sublineRef} className="mt-6 text-base text-muted-foreground sm:text-lg">
            {SUBLINE}
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
