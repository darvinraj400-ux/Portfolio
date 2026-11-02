"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import { cn } from "@/lib/utils";

type Level = "headline" | "heading" | "body" | "micro";
type Trigger = "auto" | "intro" | "after-intro" | "mount" | "view" | "group";

type LevelConfig = {
  duration: number;
  tick: number;
  /** Share of unresolved glyphs refreshed per tick. */
  noise: number;
  symbol: number;
};

const LEVELS: Record<Level, LevelConfig> = {
  headline: { duration: 980, tick: 34, noise: 1, symbol: 0.06 },
  heading: { duration: 720, tick: 40, noise: 0.9, symbol: 0.04 },
  body: { duration: 860, tick: 58, noise: 0.42, symbol: 0.02 },
  micro: { duration: 460, tick: 40, noise: 0.7, symbol: 0.01 },
};

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "+/*#&";

/**
 * Random glyphs must not be wider than the glyph they replace, otherwise the
 * overlay wraps into extra lines and covers neighbouring content.
 */
const widthCache = new Map<string, Map<string, number>>();
const poolCache = new Map<
  string,
  Map<string, { pool: string[]; symbols: string[] }>
>();
let measureCanvas: HTMLCanvasElement | null = null;

function fontKey(style: CSSStyleDeclaration) {
  return `${style.fontStyle}|${style.fontWeight}|${style.fontSize}|${style.fontFamily}`;
}

function glyphWidths(key: string, style: CSSStyleDeclaration) {
  const cached = widthCache.get(key);
  if (cached) return cached;
  if (!measureCanvas) measureCanvas = document.createElement("canvas");
  const context = measureCanvas.getContext("2d");
  const widths = new Map<string, number>();
  if (context) {
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    for (const glyph of UPPER + LOWER + DIGITS + SYMBOLS) {
      widths.set(glyph, context.measureText(glyph).width);
    }
  }
  widthCache.set(key, widths);
  return widths;
}

function glyphPools(live: HTMLElement, text: string) {
  const style = getComputedStyle(live);
  const key = fontKey(style);
  const widths = glyphWidths(key, style);
  let cache = poolCache.get(key);
  if (!cache) {
    cache = new Map();
    poolCache.set(key, cache);
  }
  const pools: string[][] = [];
  const symbols: string[][] = [];
  for (const char of text) {
    let entry = cache.get(char);
    if (!entry) {
      const limit = widths.get(char);
      const alphabet =
        char >= "A" && char <= "Z"
          ? UPPER
          : char >= "a" && char <= "z"
            ? LOWER
            : char >= "0" && char <= "9"
              ? DIGITS
              : "";
      entry =
        limit === undefined || !alphabet || limit <= 0
          ? { pool: [char], symbols: [] }
          : {
              pool: [...alphabet].filter(
                (glyph) => (widths.get(glyph) ?? Infinity) <= limit,
              ),
              symbols: [...SYMBOLS].filter(
                (glyph) => (widths.get(glyph) ?? Infinity) <= limit,
              ),
            };
      cache.set(char, entry);
    }
    pools.push(entry.pool);
    symbols.push(entry.symbols);
  }
  return { pools, symbols };
}

function pickGlyph(
  final: string,
  pool: string[],
  symbolPool: string[],
  symbolChance: number,
) {
  const options =
    symbolChance > 0 && symbolPool.length > 0 && Math.random() < symbolChance
      ? symbolPool
      : pool;
  if (options.length === 0) return final;
  return options[(Math.random() * options.length) | 0];
}

function isAlphanumeric(code: number) {
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122)
  );
}

function buildThresholds(text: string) {
  const thresholds: number[] = [];
  let animatable = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (isAlphanumeric(text.charCodeAt(index))) animatable += 1;
  }
  let seen = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (!isAlphanumeric(text.charCodeAt(index))) {
      thresholds.push(0);
      continue;
    }
    const base = animatable <= 1 ? 0 : seen / (animatable - 1);
    seen += 1;
    thresholds.push(
      Math.min(1, Math.max(0, base + (Math.random() - 0.5) * 0.14)),
    );
  }
  return thresholds;
}

type Task = {
  live: HTMLElement;
  host: HTMLElement;
  chars: string[];
  pools: string[][];
  symbolPools: string[][];
  text: string;
  config: LevelConfig;
  thresholds: number[];
  start: number;
  lastTick: number;
};

const tasks = new Set<Task>();
let frame = 0;

function tick(now: number) {
  frame = 0;
  for (const task of tasks) {
    if (now < task.start) continue;
    const raw = Math.min(1, (now - task.start) / task.config.duration);
    if (raw >= 1) {
      task.live.textContent = task.text;
      task.host.dataset.scrambleState = "done";
      tasks.delete(task);
      continue;
    }
    if (now - task.lastTick < task.config.tick) continue;
    task.lastTick = now;
    const progress = raw * raw * (3 - 2 * raw);
    for (let index = 0; index < task.chars.length; index += 1) {
      const final = task.text[index];
      if (progress >= task.thresholds[index]) {
        task.chars[index] = final;
      } else if (Math.random() < task.config.noise) {
        task.chars[index] = pickGlyph(
          final,
          task.pools[index],
          task.symbolPools[index],
          task.config.symbol,
        );
      }
    }
    task.live.textContent = task.chars.join("");
  }
  if (tasks.size > 0) frame = requestAnimationFrame(tick);
}

function beginScramble(
  host: HTMLElement,
  live: HTMLElement,
  text: string,
  level: Level,
  delay: number,
) {
  const config = LEVELS[level];
  const { pools, symbols } = glyphPools(live, text);
  const task: Task = {
    live,
    host,
    chars: Array.from(text, (char, index) =>
      pickGlyph(char, pools[index], symbols[index], config.symbol),
    ),
    pools,
    symbolPools: symbols,
    text,
    config,
    thresholds: buildThresholds(text),
    start: performance.now() + delay,
    lastTick: 0,
  };
  host.dataset.scrambleState = "running";
  live.textContent = task.chars.join("");
  tasks.add(task);
  if (!frame) frame = requestAnimationFrame(tick);

  return () => {
    tasks.delete(task);
    if (live.isConnected) live.textContent = text;
    if (host.isConnected) host.dataset.scrambleState = "done";
  };
}

type ViewCallback = () => void;

let viewObserver: IntersectionObserver | null = null;
const viewCallbacks = new Map<Element, ViewCallback>();

function observeOnce(element: Element, callback: ViewCallback) {
  if (typeof IntersectionObserver === "undefined") {
    callback();
    return () => {};
  }
  if (!viewObserver) {
    viewObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const run = viewCallbacks.get(entry.target);
          if (!run) continue;
          viewCallbacks.delete(entry.target);
          viewObserver?.unobserve(entry.target);
          run();
        }
      },
      // No negative bottom margin: anything in the bottom band could never
      // intersect, which leaves footer text permanently untriggered.
      { threshold: 0.2 },
    );
  }
  viewCallbacks.set(element, callback);
  viewObserver.observe(element);
  return () => {
    viewCallbacks.delete(element);
    viewObserver?.unobserve(element);
  };
}

/** Matches the hero line rise in globals.css: both start inside the intro. */
const INTRO_REVEAL_MS = 1500;
let introDone = false;
const introWaiters = new Set<ViewCallback>();
let introTimer = 0;
let introObserver: MutationObserver | null = null;

function finishIntro() {
  if (introDone) return;
  introDone = true;
  if (introTimer) {
    window.clearTimeout(introTimer);
    introTimer = 0;
  }
  introObserver?.disconnect();
  introObserver = null;
  for (const callback of introWaiters) callback();
  introWaiters.clear();
}

function subscribeIntro(callback: ViewCallback) {
  if (introDone) {
    callback();
    return () => {};
  }
  introWaiters.add(callback);
  if (introTimer || introObserver) {
    return () => introWaiters.delete(callback);
  }
  const root = document.documentElement;
  if (!root.hasAttribute("data-intro")) {
    introTimer = window.setTimeout(finishIntro, 120);
    return () => introWaiters.delete(callback);
  }
  introTimer = window.setTimeout(finishIntro, INTRO_REVEAL_MS);
  introObserver = new MutationObserver(() => {
    if (!root.hasAttribute("data-intro")) finishIntro();
  });
  introObserver.observe(root, {
    attributes: true,
    attributeFilter: ["data-intro"],
  });
  return () => introWaiters.delete(callback);
}

/** For chrome that sits above the intro: runs once the plate is gone. */
let afterIntroDone = false;
const afterIntroWaiters = new Set<ViewCallback>();
let afterIntroTimer = 0;
let afterIntroObserver: MutationObserver | null = null;

function finishAfterIntro() {
  if (afterIntroDone) return;
  afterIntroDone = true;
  if (afterIntroTimer) {
    window.clearTimeout(afterIntroTimer);
    afterIntroTimer = 0;
  }
  afterIntroObserver?.disconnect();
  afterIntroObserver = null;
  for (const callback of afterIntroWaiters) callback();
  afterIntroWaiters.clear();
}

function subscribeAfterIntro(callback: ViewCallback) {
  if (afterIntroDone) {
    callback();
    return () => {};
  }
  afterIntroWaiters.add(callback);
  if (afterIntroTimer || afterIntroObserver) {
    return () => afterIntroWaiters.delete(callback);
  }
  const root = document.documentElement;
  if (!root.hasAttribute("data-intro")) {
    afterIntroTimer = window.setTimeout(finishAfterIntro, 120);
  } else {
    afterIntroObserver = new MutationObserver(() => {
      if (!root.hasAttribute("data-intro")) finishAfterIntro();
    });
    afterIntroObserver.observe(root, {
      attributes: true,
      attributeFilter: ["data-intro"],
    });
  }
  return () => afterIntroWaiters.delete(callback);
}

const GroupContext = createContext<boolean | null>(null);

export function ScrambleGroup({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <GroupContext.Provider value={active}>{children}</GroupContext.Provider>
  );
}

export type ScrambleTextProps = {
  as?: "span" | "p" | "h1" | "h2" | "h3" | "div" | "dt" | "dd" | "li";
  text: string;
  level?: Level;
  /** Delay in milliseconds from the moment the trigger fires. */
  delay?: number;
  trigger?: Trigger;
  className?: string;
};

export default function ScrambleText({
  as = "span",
  text,
  level = "body",
  delay = 0,
  trigger = "auto",
  className,
}: ScrambleTextProps) {
  const { reduced } = useMotionPreference();
  const groupActive = useContext(GroupContext);
  const hostRef = useRef<HTMLElement | null>(null);
  const liveRef = useRef<HTMLSpanElement | null>(null);
  const startedRef = useRef(false);
  const cancelRef = useRef<(() => void) | null>(null);
  const timerRef = useRef(0);
  const lastTextRef = useRef(text);

  const resolvedTrigger: Exclude<Trigger, "auto"> =
    trigger === "auto" ? (groupActive === null ? "view" : "group") : trigger;

  useEffect(() => {
    const host = hostRef.current;
    const live = liveRef.current;
    if (!host || !live || reduced || startedRef.current) return;

    const arm = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      cancelRef.current = beginScramble(host, live, text, level, delay);
    };
    const armLater = () => {
      if (delay <= 0) {
        arm();
        return;
      }
      timerRef.current = window.setTimeout(arm, delay);
    };

    if (resolvedTrigger === "group" && !groupActive) return;
    if (resolvedTrigger === "group" || resolvedTrigger === "mount") {
      armLater();
      return () => window.clearTimeout(timerRef.current);
    }
    if (resolvedTrigger === "intro") {
      return subscribeIntro(armLater);
    }
    if (resolvedTrigger === "after-intro") {
      return subscribeAfterIntro(armLater);
    }
    return observeOnce(host, armLater);
  }, [delay, groupActive, level, reduced, resolvedTrigger, text]);

  useEffect(() => {
    if (!reduced) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = 0;
    cancelRef.current?.();
    cancelRef.current = null;
    const host = hostRef.current;
    const live = liveRef.current;
    if (host) host.dataset.scrambleState = "done";
    if (live) live.textContent = text;
  }, [reduced, text]);

  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef.current);
      cancelRef.current?.();
      cancelRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (lastTextRef.current === text) return;
    lastTextRef.current = text;
    window.clearTimeout(timerRef.current);
    timerRef.current = 0;
    cancelRef.current?.();
    cancelRef.current = null;
    startedRef.current = true;
    const host = hostRef.current;
    if (host) host.dataset.scrambleState = "done";
  }, [text]);

  return createElement(
    as,
    {
      ref: hostRef,
      "data-scramble-level": level,
      "data-scramble-state": "idle",
      className: cn(
        "scramble-host",
        as === "span" && "inline-block",
        className,
      ),
    },
    <span key={text} ref={liveRef} aria-hidden="true" className="scramble-live">
      {text}
    </span>,
    <span aria-hidden="true" className="scramble-reserve">
      {text}
    </span>,
    <span className="sr-only select-none">{text}</span>,
  );
}
