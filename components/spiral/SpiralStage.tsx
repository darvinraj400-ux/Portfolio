"use client";

import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Component,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import ProjectCardFallback from "@/components/prototype/ProjectCardFallback";
import type { SpiralProject } from "@/lib/spiral";
import { cn } from "@/lib/utils";
import { supportsWebGL } from "@/lib/webgl";

const SpiralCanvas = dynamic(() => import("./SpiralCanvas"), {
  ssr: false,
  loading: () => null,
});

const DESKTOP_QUERY = "(min-width: 1024px)";

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

function subscribeDesktop(callback: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getDesktopSnapshot() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function getDesktopServerSnapshot() {
  return true;
}

type WebGLStatus = "checking" | "available" | "unavailable";

const controlClass =
  "inline-flex h-11 items-center justify-center border border-line px-3.5 text-[12px] font-medium text-silver transition-colors hover:border-line-strong hover:text-paper disabled:cursor-default disabled:border-line disabled:text-graphite disabled:hover:border-line";

export default function SpiralStage({ projects }: { projects: SpiralProject[] }) {
  const { reduced } = useMotionPreference();
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getDesktopServerSnapshot,
  );
  const profile = isDesktop ? "desktop" : "mobile";
  const instructionsId = useId();
  const indexId = useId();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [webglStatus, setWebglStatus] = useState<WebGLStatus>("checking");
  const [forcedFallback, setForcedFallback] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const indexButtonRef = useRef<HTMLButtonElement>(null);

  const selectedProject =
    selectedIndex !== null ? projects[selectedIndex] ?? null : null;
  const fallbackProject =
    projects[selectedIndex ?? previewIndex ?? 0] ?? projects[0];

  const sceneActive =
    !forcedFallback && webglStatus === "available" && !sceneFailed;
  const showingScene = sceneActive && sceneReady;
  const staticPreview = !sceneActive;
  const active = visible && documentVisible;

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setForcedFallback(query.get("webgl") === "off");
  }, []);

  useEffect(() => {
    if (forcedFallback) {
      setWebglStatus("unavailable");
      return;
    }
    setWebglStatus(supportsWebGL() ? "available" : "unavailable");
  }, [forcedFallback]);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setVisible(entry.isIntersecting);
      },
      { rootMargin: "140px 0px" },
    );
    observer.observe(element);

    const onVisibilityChange = () => {
      setDocumentVisible(!document.hidden);
    };
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    setSceneReady(false);
  }, [profile]);

  const handleSceneReady = useCallback(() => {
    setSceneReady(true);
  }, []);

  const handleSceneError = useCallback(() => {
    setSceneFailed(true);
  }, []);

  const select = useCallback(
    (index: number) => {
      const project = projects[index];
      if (!project) return;
      setSelectedIndex(index);
      setAnnouncement(
        `${project.id}, ${project.name} selected. ${project.categoryLabel}. ${project.shortDescription}`,
      );
    },
    [projects],
  );

  const clearSelection = useCallback(() => {
    setSelectedIndex(null);
    setAnnouncement("Selection cleared.");
    indexButtonRef.current?.focus();
  }, []);

  const step = useCallback(
    (direction: 1 | -1) => {
      const count = projects.length;
      const next =
        selectedIndex === null
          ? direction === 1
            ? 0
            : count - 1
          : (selectedIndex + direction + count) % count;
      select(next);
    },
    [projects.length, select, selectedIndex],
  );

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (selectedIndex !== null) {
        event.preventDefault();
        setSelectedIndex(null);
        setAnnouncement("Selection cleared.");
        return;
      }
      if (indexOpen) {
        event.preventDefault();
        setIndexOpen(false);
        indexButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [indexOpen, selectedIndex]);

  const statusLabel = sceneActive
    ? sceneReady
      ? "Interactive"
      : "Preparing"
    : webglStatus === "checking"
      ? "Checking"
      : "Static preview";

  return (
    <div
      ref={stageRef}
      role="group"
      aria-label="Project spiral"
      aria-describedby={instructionsId}
      className="relative flex flex-col border border-line bg-[#040404]"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-5">
        <p className="mono-meta text-ash">
          The collection
          <span className="ml-3 text-silver">
            {String(projects.length).padStart(2, "0")}
          </span>
        </p>
        <p className="mono-meta text-ash" aria-hidden="true">
          {statusLabel}
        </p>
      </div>

      <div className="relative h-[clamp(23rem,52svh,32rem)] w-full overflow-hidden lg:h-[clamp(29rem,60svh,40rem)]">
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            showingScene ? "opacity-100" : "opacity-0",
          )}
          style={{ background: "transparent" }}
        >
          {sceneActive ? (
            <SceneBoundary onError={handleSceneError}>
              <SpiralCanvas
                key={profile}
                projects={projects}
                profile={profile}
                selectedIndex={selectedIndex}
                previewIndex={previewIndex}
                reduced={reduced}
                active={active}
                onSelect={select}
                onReady={handleSceneReady}
                onError={handleSceneError}
              />
            </SceneBoundary>
          ) : null}
        </div>

        {!showingScene ? (
          <div className="absolute inset-0 flex items-center justify-center px-5">
            {webglStatus === "checking" ||
            (sceneActive && !sceneReady) ? (
              <p className="mono-meta text-ash" role="status">
                Preparing the collection
              </p>
            ) : (
              <div className="w-full max-w-[17.5rem]">
                <ProjectCardFallback
                  index={fallbackProject.id}
                  titleLines={fallbackProject.titleLines}
                  category={fallbackProject.categoryLabel}
                  total={projects.length}
                  hovered={false}
                  selected={selectedIndex !== null}
                />
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="border-t border-line px-4 pb-4 pt-4 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-h-[7.25rem] min-w-0 sm:min-h-[6.25rem] sm:pr-6">
            {selectedProject ? (
              <>
                <p className="mono-meta text-ash">
                  {selectedProject.id} / {String(projects.length).padStart(2, "0")}
                  <span className="mx-2 text-graphite">|</span>
                  {selectedProject.categoryLabel}
                </p>
                <h3 className="mt-1.5 text-lg font-medium tracking-tight text-paper">
                  {selectedProject.name}
                </h3>
                <p className="mt-1 max-w-md text-[13px] leading-relaxed text-silver">
                  {selectedProject.shortDescription}
                </p>
              </>
            ) : (
              <>
                <p className="mono-meta text-ash">
                  Nothing selected
                  <span className="mx-2 text-graphite">|</span>
                  {projects.length} projects
                </p>
                <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-silver">
                  {staticPreview
                    ? "Choose a project to preview it here."
                    : "Choose a card to bring it forward. Its name and description appear here."}
                </p>
              </>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous project"
              className={controlClass}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next project"
              className={controlClass}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={selectedIndex === null}
              className={controlClass}
            >
              Clear
            </button>
            <button
              ref={indexButtonRef}
              type="button"
              aria-expanded={indexOpen}
              aria-controls={indexId}
              onClick={() => setIndexOpen((value) => !value)}
              className={cn(
                controlClass,
                indexOpen
                  ? "border-line-strong text-paper"
                  : "border-line text-silver",
              )}
            >
              Index
            </button>
          </div>
        </div>

        <p id={instructionsId} className="mono-meta mt-3 text-ash">
          {staticPreview
            ? "Static preview. Use previous, next or the index to browse."
            : reduced
              ? "Reduced motion is on. Use previous, next or the index to browse."
              : "Drag or swipe to turn the collection. Tap a card to select it. Escape clears."}
        </p>
      </div>

      {indexOpen ? (
        <div id={indexId} className="border-t border-line">
          <div className="flex items-baseline justify-between px-4 py-3 sm:px-5">
            <p className="mono-meta text-ash">All projects</p>
            <p className="mono-meta text-ash">
              {String(projects.length).padStart(2, "0")} entries
            </p>
          </div>
          <ul className="max-h-60 overflow-y-auto border-t border-line sm:grid sm:max-h-64 sm:grid-cols-2">
            {projects.map((project, index) => {
              const isSelected = selectedIndex === index;
              return (
                <li
                  key={project.slug}
                  className="border-b border-line sm:odd:border-r"
                >
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`${project.id}, ${project.name}, ${project.categoryLabel}`}
                    onClick={() => select(index)}
                    onPointerEnter={() => setPreviewIndex(index)}
                    onPointerLeave={() =>
                      setPreviewIndex((current) =>
                        current === index ? null : current,
                      )
                    }
                    onFocus={() => setPreviewIndex(index)}
                    onBlur={() =>
                      setPreviewIndex((current) =>
                        current === index ? null : current,
                      )
                    }
                    className="flex w-full items-baseline gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] sm:px-5"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-[0.45rem] size-1 shrink-0",
                        isSelected ? "bg-paper" : "bg-transparent",
                      )}
                    />
                    <span className="w-6 shrink-0 font-mono text-[11px] tabular-nums text-ash">
                      {project.id}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-[13px]",
                        isSelected ? "text-paper" : "text-silver",
                      )}
                    >
                      {project.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
