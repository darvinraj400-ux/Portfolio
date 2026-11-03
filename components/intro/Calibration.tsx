"use client";

import { useCallback, useRef } from "react";
import { SITE } from "@/lib/constants";
import { PROJECT_COUNT } from "@/lib/projects";

const START_KEY = "darvin-intro-start-v1";
const COMPLETE_KEY = "darvin-intro-complete-v1";
/** CSS animation ends at 2.2s; this finishes the intro without hydration. */
const FINISH_MS = 2400;

/**
 * Runs before hydration, so the plate is displayed on first paint only.
 * The finish timer lives here too: a delayed or failed hydration cannot
 * leave the plate up. Storage failures fall through and the plate still ends.
 */
const GATE_SCRIPT = `(function(){try{
var root=document.getElementById("calibration-intro");
if(!root)return;
var done=false,started=false;
try{done=window.localStorage.getItem(${JSON.stringify(COMPLETE_KEY)})==="1"}catch(e){}
try{started=window.sessionStorage.getItem(${JSON.stringify(START_KEY)})==="1"}catch(e){}
if(done||started)return;
try{window.sessionStorage.setItem(${JSON.stringify(START_KEY)},"1")}catch(e){}
var inputs=["wheel","touchstart","keydown","pointerdown"];
var timer=0;
function stop(){
if(!timer)return;
window.clearTimeout(timer);
timer=0;
for(var i=0;i<inputs.length;i++)window.removeEventListener(inputs[i],stop,true);
var node=document.getElementById("calibration-intro");
document.documentElement.removeAttribute("data-intro");
if(node)node.setAttribute("data-dismissed","true");
var active=document.activeElement;
if(node&&active&&node.contains(active)&&active.blur)active.blur();
try{window.localStorage.setItem(${JSON.stringify(COMPLETE_KEY)},"1")}catch(e){}
}
document.documentElement.setAttribute("data-intro","run");
timer=window.setTimeout(stop,${FINISH_MS});
for(var i=0;i<inputs.length;i++)window.addEventListener(inputs[i],stop,{capture:true,passive:true});
}catch(e){}})();`;

export default function Calibration() {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    document.documentElement.removeAttribute("data-intro");
    rootRef.current?.setAttribute("data-dismissed", "true");
    try {
      window.localStorage.setItem(COMPLETE_KEY, "1");
    } catch {
      // Completion cannot be persisted; the plate is gone for this visit.
    }
    const button = buttonRef.current;
    if (button && document.activeElement === button) {
      button.blur();
    }
  }, []);

  return (
    <div
      ref={rootRef}
      id="calibration-intro"
      className="calibration"
      onAnimationEnd={(event) => {
        if (event.target === rootRef.current) finish();
      }}
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
            {SITE.creator}
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
            <div className="mt-1 h-px w-full origin-left bg-line-strong">
              <div className="calibration-scale-line h-px w-full bg-paper" />
            </div>
            <p className="mono-meta mt-2 text-silver">
              IDEAS, BUILT INTO REALITY.
            </p>
          </div>
        </div>

        <div className="calibration-meta absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-line px-5 py-4 sm:px-8">
          <p className="mono-meta text-ash">{SITE.role}</p>
          <p className="mono-meta text-ash">{SITE.creator}</p>
        </div>
      </div>

      <button
        ref={buttonRef}
        type="button"
        onClick={finish}
        className="calibration-skip mono-meta absolute bottom-16 right-5 border border-line-strong px-3 py-2 text-silver transition-colors hover:border-paper/60 hover:text-paper focus-visible:border-paper focus-visible:text-paper focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-paper sm:bottom-20 sm:right-8"
      >
        Skip intro
      </button>

      <script dangerouslySetInnerHTML={{ __html: GATE_SCRIPT }} />
    </div>
  );
}
