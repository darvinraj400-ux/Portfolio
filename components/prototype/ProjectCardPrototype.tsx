"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import { cn } from "@/lib/utils";
import { supportsWebGL } from "@/lib/webgl";
import ProjectCardFallback from "./ProjectCardFallback";

const ProjectCardScene = dynamic(() => import("./ProjectCardScene"), {
  ssr: false,
  loading: () => null,
});

type WebGLStatus = "checking" | "available" | "unavailable";

type ProjectCardPrototypeProps = {
  index: string;
  title: string;
  titleLines: string[];
  category: string;
  total: number;
  forceFallback?: boolean;
};

class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function ProjectCardPrototype({
  index,
  title,
  titleLines,
  category,
  total,
  forceFallback = false,
}: ProjectCardPrototypeProps) {
  const { reduced } = useMotionPreference();
  const [selected, setSelected] = useState(false);
  const [pointerHover, setPointerHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const [webglStatus, setWebglStatus] = useState<WebGLStatus>("checking");
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const pointer = useMemo(() => ({ x: 0, y: 0 }), []);

  const hovered = pointerHover || focused;
  const sceneActive =
    !forceFallback && webglStatus === "available" && !sceneFailed;
  const showingScene = sceneActive && sceneReady;
  const stateLabel = selected ? "Selected" : hovered ? "Hover" : "Idle";

  useEffect(() => {
    if (forceFallback) {
      setWebglStatus("unavailable");
      return;
    }
    setWebglStatus(supportsWebGL() ? "available" : "unavailable");
  }, [forceFallback]);

  const handleSceneReady = useCallback(() => {
    setSceneReady(true);
  }, []);

  const handleSceneError = useCallback(() => {
    setSceneFailed(true);
  }, []);

  const resetPointer = useCallback(() => {
    pointer.x = 0;
    pointer.y = 0;
  }, [pointer]);

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "mouse" || reduced) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape" && selected) {
      event.preventDefault();
      setSelected(false);
    }
  };

  const renderLabel = sceneActive
    ? sceneReady
      ? "WebGL scene"
      : "Loading WebGL scene"
    : forceFallback
      ? "Static fallback / preview"
      : webglStatus === "unavailable"
        ? "Static fallback / WebGL unavailable"
        : "Static fallback";

  return (
    <div className="mx-auto w-full max-w-[400px]">
      <button
        type="button"
        aria-label={`${title} — project card study`}
        aria-pressed={selected}
        aria-describedby="prototype-instructions"
        data-state={selected ? "selected" : hovered ? "hover" : "idle"}
        data-render={showingScene ? "webgl" : "fallback"}
        data-reduced={reduced ? "true" : "false"}
        onClick={() => setSelected((value) => !value)}
        onPointerEnter={() => setPointerHover(true)}
        onPointerLeave={() => {
          setPointerHover(false);
          resetPointer();
        }}
        onPointerMove={handlePointerMove}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible")) setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
          resetPointer();
        }}
        onKeyDown={handleKeyDown}
        className="group relative block aspect-[4/5] w-full cursor-pointer bg-transparent p-0 text-left focus-visible:outline-offset-8"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -inset-8 rounded-[28px] blur-2xl transition-opacity duration-500",
            selected ? "opacity-100" : "opacity-0",
          )}
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,255,255,0.12), rgba(255,255,255,0.03) 55%, transparent 78%)",
          }}
        />

        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 block transition-opacity duration-500",
            showingScene ? "opacity-0" : "opacity-100",
          )}
        >
          <ProjectCardFallback
            index={index}
            titleLines={titleLines}
            category={category}
            total={total}
            hovered={hovered}
            selected={selected}
          />
        </span>

        {sceneActive ? (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 block transition-opacity duration-500",
              showingScene ? "opacity-100" : "opacity-0",
            )}
          >
            <SceneBoundary onError={handleSceneError}>
              <ProjectCardScene
                index={index}
                titleLines={titleLines}
                category={category}
                total={total}
                hovered={hovered}
                selected={selected}
                reduced={reduced}
                pointer={pointer}
                onReady={handleSceneReady}
                onError={handleSceneError}
              />
            </SceneBoundary>
          </span>
        ) : null}
      </button>

      <div className="mt-8 border-t border-line pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <p className="mono-meta">
            State <span className="text-paper">{stateLabel}</span>
          </p>
          <p className="mono-meta text-ash">
            {renderLabel}
            {reduced ? " / reduced motion" : ""}
          </p>
        </div>
        <p
          id="prototype-instructions"
          className="mt-3 text-[13px] leading-relaxed text-ash"
        >
          Hover or focus to lift. Click or press Enter to select. Escape clears.
        </p>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {selected ? `${title} selected.` : `${title} not selected.`}
      </p>
    </div>
  );
}
