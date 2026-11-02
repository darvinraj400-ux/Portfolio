"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSound } from "@/components/audio/SoundProvider";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  CHAIN,
  createChainState,
  releaseChain,
  stepChain,
} from "@/lib/chain-physics";

const PULL_THRESHOLD = 18;
const DRAG_SLOP = 6;
const MAX_PULL = CHAIN.maxStretch;

type PointerSample = { x: number; y: number; t: number };

type Drag = {
  pointerId: number;
  startX: number;
  startY: number;
  baseAngle: number;
  baseStretch: number;
  travel: number;
  pull: number;
  samples: PointerSample[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function PullChain() {
  const { theme, toggleTheme } = useTheme();
  const { playClick } = useSound();
  const { reduced } = useMotionPreference();
  const rootRef = useRef<HTMLDivElement>(null);
  const swingRef = useRef<HTMLDivElement>(null);
  const cordRef = useRef<HTMLSpanElement>(null);
  const weightRef = useRef<HTMLSpanElement>(null);
  const stateRef = useRef(createChainState());
  const frameRef = useRef(0);
  const lastFrameRef = useRef(0);
  const draggingRef = useRef(false);
  const dragRef = useRef<Drag | null>(null);
  const suppressClick = useRef(false);

  const toggle = useCallback(() => {
    playClick();
    toggleTheme();
  }, [playClick, toggleTheme]);

  const paint = useCallback(() => {
    const state = stateRef.current;
    const swing = swingRef.current;
    const cord = cordRef.current;
    const weight = weightRef.current;
    if (swing) swing.style.transform = `rotate(${state.angle}rad)`;
    if (cord) {
      cord.style.setProperty("--pull-stretch", `${state.stretch}px`);
      cord.style.transform = `skewX(${state.skew}rad)`;
    }
    if (weight) weight.style.transform = `rotate(${state.tilt}rad)`;
  }, []);

  const resetVisuals = useCallback(() => {
    stateRef.current = createChainState();
    lastFrameRef.current = 0;
    const swing = swingRef.current;
    const cord = cordRef.current;
    const weight = weightRef.current;
    if (swing) swing.style.transform = "";
    if (cord) {
      cord.style.transform = "";
      cord.style.removeProperty("--pull-stretch");
    }
    if (weight) weight.style.transform = "";
  }, []);

  const startLoop = useCallback(() => {
    if (frameRef.current) return;
    lastFrameRef.current = 0;
    const animate = (now: number) => {
      frameRef.current = 0;
      const state = stateRef.current;
      const elapsed = lastFrameRef.current
        ? (now - lastFrameRef.current) / 1000
        : 0;
      lastFrameRef.current = now;
      if (stepChain(state, elapsed, draggingRef.current)) {
        resetVisuals();
        return;
      }
      paint();
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
  }, [paint, resetVisuals]);

  useEffect(() => {
    if (!reduced) return;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    draggingRef.current = false;
    dragRef.current = null;
    resetVisuals();
  }, [reduced, resetVisuals]);

  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !event.isPrimary) return;
    if (!cordRef.current) return;
    suppressClick.current = false;
    const state = stateRef.current;
    state.angularVelocity = 0;
    state.stretchVelocity = 0;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseAngle: state.angle,
      baseStretch: state.stretch,
      travel: 0,
      pull: 0,
      samples: [{ x: event.clientX, y: event.clientY, t: performance.now() }],
    };
    draggingRef.current = true;
    rootRef.current?.setAttribute("data-pulling", "true");
    event.currentTarget.setPointerCapture(event.pointerId);
    if (!reduced) startLoop();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    drag.travel = Math.max(drag.travel, Math.hypot(dx, dy));
    drag.pull = Math.max(0, dy);

    const now = performance.now();
    drag.samples.push({ x: event.clientX, y: event.clientY, t: now });
    while (drag.samples.length > 2 && now - drag.samples[0].t > 140) {
      drag.samples.shift();
    }

    const cord = cordRef.current;
    if (reduced) {
      cord?.style.setProperty(
        "--pull-stretch",
        `${clamp(dy * 0.85, 0, MAX_PULL)}px`,
      );
      return;
    }

    const state = stateRef.current;
    // CSS rotate(+angle) swings the hanging cord left; a rightward drag (dx>0)
    // therefore needs a negative angle to follow the pointer.
    state.angle = clamp(
      drag.baseAngle - dx / CHAIN.arm,
      -CHAIN.maxAngle,
      CHAIN.maxAngle,
    );
    state.stretch = clamp(drag.baseStretch + dy * 0.85, 0, MAX_PULL);

    const last = drag.samples[drag.samples.length - 1];
    const previous = drag.samples[drag.samples.length - 2];
    if (previous) {
      const span = Math.max(8, now - previous.t) / 1000;
      state.angularVelocity = clamp(
        -(last.x - previous.x) / span / CHAIN.arm,
        -CHAIN.releaseAngularMax,
        CHAIN.releaseAngularMax,
      );
    }
    // The drag rAF loop paints on its next frame.
  };

  const endDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
    cancelled: boolean,
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    draggingRef.current = false;
    rootRef.current?.removeAttribute("data-pulling");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const state = stateRef.current;

    if (reduced) {
      resetVisuals();
    } else {
      if (!cancelled) {
        const first = drag.samples[0];
        const last = drag.samples[drag.samples.length - 1];
        const span = Math.max(16, last.t - first.t) / 1000;
        releaseChain(
          state,
          -(last.x - first.x) / span,
          (last.y - first.y) / span,
        );
        if (drag.travel < 2) {
          state.angularVelocity = 0;
          state.stretchVelocity = 0;
        }
        if (Math.abs(state.angle) < 0.01) state.angularVelocity = 0;
      }
      startLoop();
    }

    if (cancelled) {
      suppressClick.current = true;
    } else if (drag.pull >= PULL_THRESHOLD) {
      // The release also emits a native click, which the theme swap can delay
      // past any fixed timeout. Suppress exactly the next one instead.
      suppressClick.current = true;
      toggle();
    } else if (drag.travel > DRAG_SLOP) {
      suppressClick.current = true;
    }
  };

  const handleClick = () => {
    if (!suppressClick.current) toggle();
    suppressClick.current = false;
  };

  const light = theme === "light";

  return (
    <div ref={rootRef} className="pull-chain">
      <span aria-hidden="true" className="pull-chain-bracket">
        <span />
        <span />
      </span>
      <div ref={swingRef} className="pull-chain-swing">
        <span ref={cordRef} aria-hidden="true" className="pull-chain-cord">
          <span className="pull-chain-links" />
        </span>
        <button
          type="button"
          data-sound-silent=""
          aria-pressed={light}
          aria-label={
            light
              ? "Pull chain to switch to Dark Mode"
              : "Pull chain to switch to Light Mode"
          }
          onClick={handleClick}
          onKeyDown={() => {
            suppressClick.current = false;
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(event) => endDrag(event, false)}
          onPointerCancel={(event) => endDrag(event, true)}
          className="pull-chain-hit"
        >
          <span ref={weightRef} aria-hidden="true" className="pull-chain-weight">
            <span aria-hidden="true" className="pull-chain-handle" />
          </span>
          <span aria-hidden="true" className="pull-chain-label">
            {light ? "Pull for dark" : "Pull for light"}
          </span>
        </button>
      </div>
    </div>
  );
}
