"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import { SITE } from "@/lib/constants";
import {
  reportLandingStep,
  useLandingReadiness,
  type LandingStep,
} from "@/lib/landing-ready";
import { PROJECT_COUNT } from "@/lib/projects";

const START_KEY = "darvin-intro-start-v1";
const COMPLETE_KEY = "darvin-intro-complete-v1";
/** The overlay never outlives this, even if hydration never reports readiness. */
const GATE_FAILSAFE_MS = 12000;
/** A font failure is a safe fallback; slow font files must not hold the entry. */
const FONT_WAIT_MS = 3000;
/** Full reveal, measured from readiness confirmation to free interaction. */
const REVEAL_FULL_MS = 3500;
const REVEAL_REDUCED_MS = 550;

type Phase = "idle" | "loading" | "revealing" | "done";

const STATUS: Record<LandingStep, string> = {
  data: "LOADING PROJECT DATA",
  fonts: "PREPARING TYPOGRAPHY",
  layout: "BUILDING VISUAL ENVIRONMENT",
  atlas: "BUILDING VISUAL ENVIRONMENT",
  world: "INITIALISING 3D ENGINE",
  renderer: "INITIALISING 3D ENGINE",
  frame: "PREPARING EXPERIENCE",
};

declare global {
  interface Window {
    __darvinIntroTimer?: number;
  }
}

/**
 * Runs before hydration, so the plate is displayed on first paint only.
 * Readiness is owned by the React component; this script only starts the
 * entry and provides a hard 12s recovery so a failed hydration cannot trap
 * the visitor behind the plate.
 */
const GATE_SCRIPT = `(function(){try{
var root=document.getElementById("calibration-intro");
if(!root)return;
var done=false,started=false;
try{done=window.localStorage.getItem(${JSON.stringify(COMPLETE_KEY)})==="1"}catch(e){}
try{started=window.sessionStorage.getItem(${JSON.stringify(START_KEY)})==="1"}catch(e){}
if(done||started)return;
try{window.sessionStorage.setItem(${JSON.stringify(START_KEY)},"1")}catch(e){}
document.documentElement.setAttribute("data-intro","run");
window.__darvinIntroTimer=window.setTimeout(function(){
if(document.documentElement.getAttribute("data-intro")!=="run")return;
console.warn("[intro] Readiness gate timed out; revealing the available experience.");
document.documentElement.removeAttribute("data-intro");
var node=document.getElementById("calibration-intro");
if(node)node.setAttribute("data-dismissed","true");
var active=document.activeElement;
if(node&&active&&node.contains(active)&&active.blur)active.blur();
try{window.localStorage.setItem(${JSON.stringify(COMPLETE_KEY)},"1")}catch(e){}
},${GATE_FAILSAFE_MS});
}catch(e){}})();`;

export default function Calibration() {
  const { reduced } = useMotionPreference();
  const landing = useLandingReadiness();
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const revealTimerRef = useRef(0);

  const finish = useCallback(() => {
    if (phaseRef.current === "done") return;
    phaseRef.current = "done";
    setPhase("done");
    window.clearTimeout(revealTimerRef.current);
    revealTimerRef.current = 0;
    document.documentElement.removeAttribute("data-intro");
    rootRef.current?.setAttribute("data-dismissed", "true");
    try {
      window.localStorage.setItem(COMPLETE_KEY, "1");
    } catch {
      // Completion cannot be persisted; the plate is gone for this visit.
    }
    if (window.__darvinIntroTimer) {
      window.clearTimeout(window.__darvinIntroTimer);
      window.__darvinIntroTimer = undefined;
    }
    const button = buttonRef.current;
    if (button && document.activeElement === button) button.blur();
  }, []);

  const reveal = useCallback(() => {
    if (phaseRef.current !== "loading") return;
    const root = document.documentElement;
    if (root.getAttribute("data-intro") !== "run") {
      // The pre-hydration failsafe already revealed the page.
      finish();
      return;
    }
    phaseRef.current = "revealing";
    setPhase("revealing");
    root.setAttribute("data-intro", "lift");
    revealTimerRef.current = window.setTimeout(
      finish,
      reduced ? REVEAL_REDUCED_MS : REVEAL_FULL_MS,
    );
  }, [finish, reduced]);

  useEffect(() => {
    if (document.documentElement.getAttribute("data-intro") !== "run") {
      phaseRef.current = "done";
      setPhase("done");
      return;
    }
    phaseRef.current = "loading";
    setPhase("loading");

    let cancelled = false;
    const timers: number[] = [];
    const frames: number[] = [];

    reportLandingStep("data");

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) reportLandingStep("fonts");
      });
    }
    timers.push(
      window.setTimeout(() => {
        if (!cancelled) reportLandingStep("fonts");
      }, FONT_WAIT_MS),
    );

    frames.push(
      requestAnimationFrame(() => {
        frames.push(
          requestAnimationFrame(() => {
            if (!cancelled) reportLandingStep("layout");
          }),
        );
      }),
    );

    return () => {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
      for (const frame of frames) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (phase !== "loading" || !landing.ready) return;
    reveal();
  }, [landing.ready, phase, reveal]);

  useEffect(
    () => () => {
      window.clearTimeout(revealTimerRef.current);
      // Leaving before the entry completes must not leave the document gated.
      if (document.documentElement.getAttribute("data-intro") === "run") {
        document.documentElement.removeAttribute("data-intro");
      }
    },
    [],
  );

  const statusText =
    landing.current !== null
      ? STATUS[landing.current]
      : landing.mode === "fallback"
        ? "PREPARING STATIC PREVIEW"
        : "PREPARING EXPERIENCE";

  return (
    <div
      ref={rootRef}
      id="calibration-intro"
      className="calibration"
      data-phase={phase}
      data-mode={landing.mode}
      data-ready={landing.ready ? "true" : "false"}
      aria-busy={phase === "loading"}
      style={{ "--intro-progress": landing.progress } as CSSProperties}
    >
      <div aria-hidden="true" className="calibration-plate">
        <div className="studio-grid calibration-grid" />

        <div className="calibration-meta absolute inset-x-0 top-0 flex items-center justify-between border-b border-line px-5 py-4 sm:px-8">
          <p className="mono-meta">Portfolio / 2026</p>
          <p className="mono-meta">{SITE.creator}</p>
        </div>

        <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-8">
          <p className="calibration-meta mono-meta flex items-center gap-2 text-ash">
            {SITE.studio}
            <span className="h-px w-6 bg-graphite" />
            INITIALISING EXPERIENCE
          </p>

          <p className="hero-wordmark mt-4 overflow-hidden text-paper">
            <span className="calibration-line block">DARVINN</span>
          </p>
          <p className="hero-wordmark overflow-hidden text-chrome">
            <span className="calibration-line calibration-line-2 block">
              STUDIO
            </span>
          </p>

          <div className="calibration-meta mt-7 w-full max-w-3xl sm:mt-9">
            <div className="calibration-ticks flex h-4 items-end justify-between">
              {Array.from({ length: PROJECT_COUNT }, (_, index) => (
                <span
                  key={index}
                  className="w-px bg-line-strong"
                  style={{ height: index % 6 === 0 ? "100%" : "45%" }}
                />
              ))}
            </div>
            <div className="calibration-track relative mt-1 h-px w-full overflow-hidden bg-line-strong">
              <div className="calibration-progress h-px w-full bg-paper" />
              <span className="calibration-glint absolute inset-y-0 left-0 w-1/4" />
            </div>
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p className="mono-meta text-silver">{statusText}</p>
              <p className="mono-meta text-ash">IDEAS, BUILT INTO REALITY.</p>
            </div>
          </div>
        </div>

        <div className="calibration-meta absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-line px-5 py-4 sm:px-8">
          <p className="mono-meta text-ash">{SITE.role}</p>
          <p className="mono-meta text-ash">{SITE.creator}</p>
        </div>
      </div>

      <div aria-hidden="true" className="calibration-sweep" />

      <p className="sr-only" role="status" aria-live="polite">
        {statusText}
      </p>

      {phase === "revealing" && !reduced ? (
        <button
          ref={buttonRef}
          type="button"
          onClick={finish}
          className="calibration-skip mono-meta absolute bottom-[calc(4rem+env(safe-area-inset-bottom))] right-5 border border-line-strong px-3 py-2 text-silver transition-colors hover:border-paper/60 hover:text-paper focus-visible:border-paper focus-visible:text-paper focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-paper sm:bottom-[calc(5rem+env(safe-area-inset-bottom))] sm:right-8"
        >
          Skip intro
        </button>
      ) : null}

      <script dangerouslySetInnerHTML={{ __html: GATE_SCRIPT }} />
    </div>
  );
}
