"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Component,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useSound } from "@/components/audio/SoundProvider";
import ScrambleText from "@/components/motion/ScrambleText";
import { SITE } from "@/lib/constants";
import { getVortexEnvironment } from "@/lib/vortex-config";
import { createVortexScrollModel } from "@/lib/vortex-scroll";
import { loadVortexScene } from "@/lib/vortex-state";
import type {
  VortexDebugHandle,
  VortexInput,
  VortexProject,
} from "@/lib/vortex-types";
import { cn } from "@/lib/utils";
import { supportsWebGL } from "@/lib/webgl";
import VortexDebug from "./VortexDebug";

const VortexCanvas = dynamic(() => import("./VortexCanvas"), {
  ssr: false,
  loading: () => null,
});

const DESKTOP_QUERY = "(min-width: 1024px)";

const DISCIPLINES = [
  "Web development",
  "AI-assisted development",
  "UI/UX design",
  "Automation",
] as const;

const HERO_DESCRIPTION =
  "I'm Darvin Raj, an independent digital creator exploring the intersection of artificial intelligence, design and development. I turn ideas into websites, digital products and intelligent solutions through creative thinking and AI-assisted workflows.";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

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

const FALLBACK_POSITIONS = [
  { left: "6%", top: "17%", rotate: -5 },
  { right: "6%", top: "23%", rotate: 4 },
  { left: "29%", top: "40%", rotate: -1 },
  { left: "12%", top: "59%", rotate: 3 },
  { right: "10%", top: "55%", rotate: -4 },
];

const FALLBACK_POSITIONS_COMPACT = [
  { left: "4%", top: "34%", rotate: -3 },
  { right: "4%", top: "39%", rotate: 3 },
  { left: "6%", top: "52%", rotate: -1.5 },
  { right: "5%", top: "57%", rotate: 2 },
  { left: "4%", top: "69%", rotate: -2 },
];

function FallbackCard({
  project,
  selected,
  compact,
  dense,
}: {
  project: VortexProject;
  selected: boolean;
  compact: boolean;
  dense?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative aspect-[1.4146] w-full overflow-hidden rounded-[7px] border bg-[#08080a] shadow-[0_30px_80px_-36px_rgba(0,0,0,0.95)]",
        selected ? "border-white/70" : "border-white/20",
      )}
    >
      <div className="relative flex h-full">
        <div
          className={cn(
            "flex flex-col justify-between",
            dense ? "w-[60%] gap-1 p-2" : "w-[56%]",
            compact && !dense ? "gap-1.5 p-2.5" : "",
            !compact && !dense ? "gap-2 p-3" : "",
          )}
        >
          <div
            className={cn(
              "flex items-baseline justify-between gap-2 font-mono tracking-[0.16em] text-[#d2d2d2]",
              dense ? "gap-1 text-[6px]" : compact ? "gap-1 text-[6.5px]" : "text-[8px]",
            )}
          >
            <span>{compact || dense ? "DARVINN" : "DARVINN STUDIO"}</span>
            <span className="text-ash">{project.index}</span>
          </div>
          <div>
            <p
              className={cn(
                "truncate font-mono tracking-[0.12em] text-ash",
                dense ? "text-[6px]" : compact ? "text-[6.5px]" : "text-[8px]",
              )}
            >
              {project.category}
            </p>
            <p
              className={cn(
                "font-semibold tracking-[-0.03em] text-paper",
                dense
                  ? "mt-0.5 text-[11px] leading-[1.08]"
                  : compact
                    ? "mt-0.5 text-[13px] leading-[1.05]"
                    : "mt-1 text-[clamp(0.95rem,1.8vw,1.5rem)] leading-[1.02]",
              )}
            >
              {project.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>
          {compact || dense ? null : (
            <div className="flex items-baseline justify-between gap-2 border-t border-white/10 pt-1.5 font-mono text-[7px] tracking-[0.1em] text-ash">
              <span>Placeholder artwork</span>
              <span>2026</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "relative overflow-hidden border-l border-white/15 bg-[#060607]",
            dense ? "w-[40%]" : "w-[44%]",
          )}
        >
          <div
            className="absolute left-1/2 top-[41%] aspect-square w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15"
            style={{
              background:
                "linear-gradient(160deg, #c9c9cb 0%, #8f8f92 22%, #4a4a4d 52%, #161618 70%, #040405 100%)",
            }}
          >
            <div
              className="absolute inset-x-0 bottom-0 h-1/2"
              style={{
                background:
                  "linear-gradient(180deg, rgba(34,34,38,0) 0%, rgba(24,24,27,0.8) 42%, #08080a 100%)",
              }}
            />
            <div className="absolute left-[18%] top-[8%] h-[68%] w-[12%] -rotate-[16deg] rounded-full bg-white/60 blur-[3px]" />
          </div>
          <div
            className={cn(
              "absolute inset-x-3 bottom-2 flex justify-between font-mono tracking-[0.12em] text-ash",
              dense ? "inset-x-2 bottom-1.5 text-[5.5px]" : "",
              compact && !dense ? "inset-x-2 bottom-1.5 text-[6px]" : "",
              !compact && !dense ? "text-[7px]" : "",
            )}
          >
            <span>Silver study</span>
            <span>Fig. 01</span>
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />
    </div>
  );
}

function FallbackScene({
  projects,
  selectedIndex,
  compact,
}: {
  projects: VortexProject[];
  selectedIndex: number | null;
  compact: boolean;
}) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      data-vortex-fallback=""
      style={{
        background:
          "radial-gradient(78% 64% at 50% 42%, var(--vortex-core) 0%, var(--vortex-mid) 58%, var(--vortex-edge) 100%)",
      }}
      aria-hidden="true"
    >
      {projects.map((project, index) => {
        const position = (compact
          ? FALLBACK_POSITIONS_COMPACT
          : FALLBACK_POSITIONS)[index];
        const selected = selectedIndex === index;
        return (
          <div
            key={project.slug}
            className={cn(
              "absolute",
              compact
                ? "w-[43vw] max-w-[11rem]"
                : "w-[56vw] max-w-[15.5rem] sm:w-[34vw] sm:max-w-[20rem]",
            )}
            style={{
              left: position.left,
              right: position.right,
              top: position.top,
              zIndex: selected ? 20 : index + 1,
              transform: `rotate(${position.rotate}deg) scale(${selected ? 1.05 : 1})`,
            }}
          >
            <FallbackCard
              project={project}
              selected={selected}
              compact={compact}
            />
          </div>
        );
      })}
    </div>
  );
}

function FallbackSceneFull({
  projects,
  selectedIndex,
  home,
}: {
  projects: VortexProject[];
  selectedIndex: number | null;
  home: boolean;
}) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      data-vortex-fallback=""
      style={{
        background:
          "radial-gradient(78% 64% at 50% 42%, var(--vortex-core) 0%, var(--vortex-mid) 58%, var(--vortex-edge) 100%)",
      }}
      aria-hidden="true"
    >
      <div
        data-lenis-prevent
        className={cn(
          "absolute inset-x-0 overflow-y-auto overscroll-contain",
          home
            ? "bottom-[9rem] top-[24rem] sm:bottom-[8rem] lg:top-[23rem]"
            : "bottom-[9rem] top-[10.5rem] sm:top-[10rem]",
        )}
      >
        <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-2 px-3 pb-4 sm:max-w-5xl sm:grid-cols-3 sm:gap-2.5 sm:px-6 lg:grid-cols-4">
          {projects.map((project, index) => {
            const selected = selectedIndex === index;
            return (
              <div
                key={project.slug}
                className={cn(
                  "relative transition-transform duration-300",
                  selected ? "z-10 scale-[1.04]" : "",
                )}
                style={{
                  transform: `rotate(${((index % 5) - 2) * 0.45}deg)`,
                }}
              >
                <FallbackCard
                  project={project}
                  selected={selected}
                  compact
                  dense
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function VortexStage({
  projects,
  variant = "prototype",
}: {
  projects: VortexProject[];
  variant?: "prototype" | "home";
}) {
  const home = variant === "home";
  const { reduced } = useMotionPreference();
  const { theme } = useTheme();
  const { playClick } = useSound();
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getDesktopServerSnapshot,
  );
  const profile = isDesktop ? "desktop" : "mobile";
  const full = projects.length > 5;
  const population = full ? 33 : 5;
  const environment = useMemo(
    () => getVortexEnvironment(profile === "mobile", population),
    [population, profile],
  );

  const headingId = useId();
  const instructionsId = useId();
  const indexId = useId();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [webglStatus, setWebglStatus] = useState<WebGLStatus>("checking");
  const [queryReady, setQueryReady] = useState(false);
  const [forcedFallback, setForcedFallback] = useState(false);
  const [debug, setDebug] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<VortexInput>({
    scrollImpulse: 0,
    scrollDirection: 1,
    pointerX: 0,
    pointerY: 0,
    pointerActive: false,
  });
  const debugHandleRef = useRef<VortexDebugHandle | null>(null);
  const selectedRef = useRef<number | null>(null);
  const restoredRef = useRef(false);
  const pointerFrameRef = useRef(0);
  const pointerSampleRef = useRef<{ x: number; y: number } | null>(null);
  selectedRef.current = selectedIndex;

  const sceneActive =
    queryReady &&
    !forcedFallback &&
    webglStatus === "available" &&
    !sceneFailed;
  const showingScene = sceneActive && sceneReady;
  const active = visible && documentVisible && sceneActive;
  const showFallback = !showingScene;
  const activeRef = useRef(active);
  activeRef.current = active;

  const selectedProject =
    selectedIndex !== null ? projects[selectedIndex] ?? null : null;

  const handleSelect = useCallback(
    (index: number | null) => {
      if (index === null) {
        if (selectedRef.current === null) return;
        playClick();
        setSelectedIndex(null);
        setAnnouncement("Selection cleared.");
        return;
      }
      const next = selectedRef.current === index ? null : index;
      const project = projects[index];
      playClick();
      setSelectedIndex(next);
      if (!project) {
        setAnnouncement("Selection cleared.");
        return;
      }
      setAnnouncement(
        next === null
          ? "Selection cleared."
          : `${project.index}, ${project.name} brought to the foreground. ${project.category}.`,
      );
    },
    [playClick, projects],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setForcedFallback(
      params.get("webgl") === "off" || params.get("fallback") === "1",
    );
    setDebug(params.get("debug") === "1");
    setQueryReady(true);
  }, []);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    if (reduced) return;
    const saved = loadVortexScene();
    if (!saved) return;
    if (
      saved.profile !== environment.id ||
      saved.population !== projects.length
    ) {
      return;
    }
    const selected = saved.world.selected;
    if (selected !== null && !projects[selected]) return;
    setSelectedIndex(selected);
  }, [environment.id, projects, reduced]);

  useEffect(() => {
    if (!queryReady) return;
    if (forcedFallback) {
      setWebglStatus("unavailable");
      return;
    }
    setWebglStatus(supportsWebGL() ? "available" : "unavailable");
  }, [forcedFallback, queryReady]);

  useEffect(() => {
    setSceneReady(false);
  }, [environment.id]);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setVisible(entry.isIntersecting);
      },
      { rootMargin: "120px 0px" },
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
    if (reduced) {
      inputRef.current.pointerActive = false;
      return;
    }

    const model = createVortexScrollModel(
      inputRef.current,
      {
        gain: environment.wind.scrollGain,
        teleportPx: Math.max(1200, window.innerHeight * 1.5),
      },
      window.scrollY,
      performance.now(),
    );

    const nestedScrollerEats = (target: EventTarget | null, deltaY: number) => {
      if (!(target instanceof Element)) return false;
      let node: Element | null = target;
      while (
        node &&
        node !== document.body &&
        node !== document.documentElement
      ) {
        const overflow = getComputedStyle(node).overflowY;
        if (overflow === "auto" || overflow === "scroll") {
          const range = node.scrollHeight - node.clientHeight;
          if (range > 1) {
            const canMove =
              deltaY < 0 ? node.scrollTop > 0 : node.scrollTop < range - 1;
            if (canMove) return true;
          }
        }
        node = node.parentElement;
      }
      return false;
    };

    const handleScroll = () => {
      model.scroll(window.scrollY, performance.now(), activeRef.current);
    };

    const handleWheel = (event: globalThis.WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        model.suppress(performance.now());
        return;
      }
      if (!activeRef.current) return;
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? window.innerHeight
            : 1;
      const deltaY = event.deltaY * unit;
      if (Math.abs(deltaY) < 0.5) return;
      if (nestedScrollerEats(event.target, deltaY)) return;

      const root = document.documentElement;
      const atTop = window.scrollY <= 0;
      const atBottom =
        window.scrollY + window.innerHeight >= root.scrollHeight - 1;
      if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) return;

      model.wheel(deltaY, performance.now());
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [environment, reduced]);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (selectedRef.current === null) return;
      event.preventDefault();
      setSelectedIndex(null);
      setAnnouncement("Selection cleared.");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!active) inputRef.current.pointerActive = false;
  }, [active]);

  const handleSceneReady = useCallback(() => {
    setSceneReady(true);
  }, []);

  const handleSceneError = useCallback(() => {
    setSceneFailed(true);
  }, []);

  const handleDebugHandle = useCallback(
    (handle: VortexDebugHandle | null) => {
      debugHandleRef.current = handle;
    },
    [],
  );

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    if (reduced) return;
    pointerSampleRef.current = { x: event.clientX, y: event.clientY };
    if (pointerFrameRef.current) return;
    pointerFrameRef.current = requestAnimationFrame(() => {
      pointerFrameRef.current = 0;
      const sample = pointerSampleRef.current;
      const stage = stageRef.current;
      if (!sample || !stage) return;
      // One layout read per frame no matter how many pointer events arrive.
      const bounds = stage.getBoundingClientRect();
      const input = inputRef.current;
      input.pointerX = ((sample.x - bounds.left) / bounds.width) * 2 - 1;
      input.pointerY = ((sample.y - bounds.top) / bounds.height) * 2 - 1;
      input.pointerActive = true;
    });
  };

  const resetPointer = () => {
    if (pointerFrameRef.current) cancelAnimationFrame(pointerFrameRef.current);
    pointerFrameRef.current = 0;
    pointerSampleRef.current = null;
    inputRef.current.pointerActive = false;
  };

  useEffect(
    () => () => {
      if (pointerFrameRef.current) {
        cancelAnimationFrame(pointerFrameRef.current);
      }
    },
    [],
  );

  const statusLabel = !queryReady
    ? "Preparing"
    : !sceneActive
      ? webglStatus === "checking"
        ? "Preparing"
        : "Static preview"
      : reduced
        ? "Reduced motion"
        : sceneReady
          ? "Active"
          : "Preparing";

  return (
    <section
      id={home ? "top" : undefined}
      aria-labelledby={headingId}
      className="relative isolate"
    >
      <div
        className={cn(
          "relative",
          home ? "h-[190svh] lg:h-[220svh]" : "h-[220svh] lg:h-[280svh]",
        )}
      >
        <div
          ref={stageRef}
          data-render={showingScene ? "webgl" : "fallback"}
          data-profile={profile}
          data-population={projects.length}
          data-reduced={reduced ? "true" : "false"}
          data-selected={selectedIndex ?? "none"}
          className="sticky top-16 flex h-[calc(100svh-4rem)] flex-col overflow-hidden bg-background"
          onPointerMoveCapture={handlePointerMove}
          onPointerLeave={resetPointer}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(78% 64% at 50% 42%, var(--vortex-core) 0%, var(--vortex-mid) 58%, var(--vortex-edge) 100%)",
            }}
          />

          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0",
              showingScene ? "opacity-100" : "opacity-0",
            )}
          >
            {sceneActive ? (
              <SceneBoundary onError={handleSceneError}>
                <VortexCanvas
                  key={`${environment.id}-${projects.length}`}
                  projects={projects}
                  environment={environment}
                  theme={theme}
                  selectedIndex={selectedIndex}
                  reduced={reduced}
                  active={active}
                  input={inputRef.current}
                  onSelect={handleSelect}
                  onReady={handleSceneReady}
                  onError={handleSceneError}
                  onDebugHandle={handleDebugHandle}
                />
              </SceneBoundary>
            ) : null}
          </div>

          {showFallback ? (
            full ? (
              <FallbackSceneFull
                projects={projects}
                selectedIndex={selectedIndex}
                home={home}
              />
            ) : (
              <FallbackScene
                projects={projects}
                selectedIndex={selectedIndex}
                compact={!isDesktop}
              />
            )
          ) : null}

          {reduced ? (
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-background via-background/90 to-transparent",
                home
                  ? "h-[52svh]"
                  : "hidden h-[34svh] max-[384px]:block",
              )}
            />
          ) : null}

          {home ? (
            <div className="hero-plate pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-background via-background/88 to-transparent pb-14 sm:pb-20">
              <div className="shell pt-4 sm:pt-5">
                <div className="mt-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line/80 pb-3 sm:mt-0">
                  <ScrambleText
                    as="p"
                    className="mono-meta"
                    text={SITE.signature}
                    level="micro"
                    trigger="intro"
                    delay={650}
                  />
                  <ScrambleText
                    as="p"
                    className="mono-meta hidden text-ash xl:block"
                    text="Portfolio / 2026"
                    level="micro"
                    trigger="intro"
                    delay={700}
                  />
                </div>
                <div className="mt-5 grid gap-x-10 gap-y-6 lg:mt-7 lg:grid-cols-12">
                  <div className="min-w-0 lg:col-span-8 xl:col-span-7">
                    <ScrambleText
                      as="p"
                      className="mono-meta text-ash"
                      text={SITE.role}
                      level="micro"
                      trigger="intro"
                      delay={550}
                    />
                    <h1
                      id={headingId}
                      className="mt-3 max-w-[19ch] text-[clamp(1.9rem,7.4vw,3.8rem)] font-semibold uppercase leading-[0.9] tracking-[-0.055em] text-paper"
                    >
                      <span className="plate-mask">
                        <span className="plate-line">
                          <ScrambleText
                            text="IDEAS, BUILT"
                            level="headline"
                            trigger="intro"
                          />
                        </span>
                      </span>
                      <span className="plate-mask">
                        <span className="plate-line plate-line-2">
                          <ScrambleText
                            className="text-chrome plate-sweep"
                            text="INTO REALITY."
                            level="headline"
                            trigger="intro"
                            delay={60}
                          />
                        </span>
                      </span>
                    </h1>
                    <ScrambleText
                      as="p"
                      className="plate-follow mt-4 max-w-md text-[13px] leading-relaxed text-paper sm:text-sm"
                      text={SITE.positioning}
                      level="heading"
                      trigger="intro"
                      delay={120}
                    />
                    <ScrambleText
                      as="p"
                      className="mt-2 max-w-md text-[12px] leading-relaxed text-silver sm:text-[13px]"
                      text={HERO_DESCRIPTION}
                      level="body"
                      trigger="intro"
                      delay={180}
                    />
                    <p id={instructionsId} className="sr-only">
                      {reduced
                        ? "Reduced motion is on. Choose a project from the index to inspect it."
                        : "Scroll to move through the field, or choose a project from the index to inspect it."}
                    </p>
                    <div className="pointer-events-auto mt-5 flex flex-wrap items-center gap-x-7 gap-y-3">
                      <Link
                        href="/projects"
                        className="inline-flex h-10 items-center bg-paper px-4 text-[13px] font-medium text-background transition-colors hover:bg-silver"
                      >
                        <ScrambleText
                          text="View selected work"
                          level="micro"
                          trigger="intro"
                          delay={240}
                        />
                      </Link>
                      <a
                        href="#contact"
                        className="link-underline pb-1 text-[13px] text-silver transition-colors hover:text-paper"
                      >
                        <ScrambleText
                          text="Start a project"
                          level="micro"
                          trigger="intro"
                          delay={280}
                        />
                      </a>
                    </div>
                  </div>
                  <div className="hidden lg:col-span-4 lg:block xl:col-span-5">
                    <div className="ml-auto w-full max-w-[14rem] text-right">
                      <p className="mono-meta text-silver">{statusLabel}</p>
                      <ScrambleText
                        as="p"
                        className="mono-meta mt-1 text-ash"
                        text="Focus"
                        level="micro"
                        trigger="intro"
                        delay={750}
                      />
                      <ul className="mt-5 border-t border-line/80">
                        {DISCIPLINES.map((discipline, index) => (
                          <li
                            key={discipline}
                            className="flex items-baseline justify-between gap-3 border-b border-line/80 py-2"
                          >
                            <ScrambleText
                              className="text-[11px] text-silver"
                              text={discipline}
                              level="micro"
                              trigger="intro"
                              delay={780 + index * 50}
                            />
                            <span
                              aria-hidden="true"
                              className="font-mono text-[11px] tabular-nums text-ash"
                            >
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-background to-transparent pb-28",
                full ? "via-background/85" : "via-background/60",
              )}
            >
              <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-6 px-4 pt-4 sm:px-6 sm:pt-5">
                <div className="min-w-0 max-w-sm">
                  <p className="mono-meta text-ash">
                    {full
                      ? "Stage 1E / full vortex"
                      : "Stage 1D revision / wind chamber"}
                  </p>
                  <h1
                    id={headingId}
                    className="mt-1.5 text-[15px] font-medium tracking-tight text-paper sm:text-base"
                  >
                    {full
                      ? `${projects.length} cards in an invisible vortex`
                      : "Five cards in an invisible vortex"}
                  </h1>
                  <p
                    id={instructionsId}
                    className="mt-1.5 text-[12px] leading-relaxed text-silver sm:text-[13px]"
                  >
                    {reduced
                      ? "Reduced motion is on. The field is still; use the index to inspect each card."
                      : full
                        ? "Scroll to stir the air. Select a card or open the project index. Escape clears."
                        : "Scroll to stir the air. Select a card to bring it forward. Escape clears."}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="mono-meta text-silver">{statusLabel}</p>
                  <p className="mono-meta mt-1 text-ash">
                    {String(projects.length).padStart(2, "0")} objects
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 z-20">
            <div
              role="group"
              aria-label="Project cards"
              aria-describedby={instructionsId}
              className="pointer-events-auto border-t border-line/80 bg-background/70 backdrop-blur-md"
              onPointerMove={(event) => event.stopPropagation()}
            >
              <div
                className={
                  home
                    ? "shell py-3"
                    : "mx-auto w-full max-w-5xl px-4 py-3 sm:px-6"
                }
              >
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="mono-meta text-ash">
                      {selectedProject
                        ? `${selectedProject.index} — ${selectedProject.category}`
                        : "Selected work"}
                    </p>
                    <p className="mt-1 truncate text-[13px] text-paper sm:text-sm">
                      {selectedProject
                        ? selectedProject.name
                        : "Choose a project to inspect it."}
                    </p>
                    {full && selectedProject?.shortDescription ? (
                      <p className="mt-1 line-clamp-2 max-w-lg text-[11px] leading-relaxed text-ash">
                        {selectedProject.shortDescription}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelect(null)}
                    disabled={selectedIndex === null}
                    className="inline-flex h-9 shrink-0 items-center border border-line px-3 text-[11px] font-medium text-silver transition-colors hover:border-line-strong hover:text-paper disabled:cursor-default disabled:border-line disabled:text-graphite"
                  >
                    Clear
                  </button>
                </div>

                {full ? (
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="mono-meta text-ash">
                        {indexOpen
                          ? "Selected work / choose one"
                          : "Selected work index"}
                      </p>
                      <button
                        type="button"
                        aria-expanded={indexOpen}
                        aria-controls={indexId}
                        onClick={() => setIndexOpen((open) => !open)}
                        className="inline-flex h-9 shrink-0 items-center border border-line px-3 text-[10px] font-medium tracking-[0.06em] text-silver transition-colors hover:border-line-strong hover:text-paper"
                      >
                        {indexOpen ? "Close index" : "Project index"}
                      </button>
                    </div>

                    {indexOpen ? (
                      <div
                        id={indexId}
                        data-lenis-prevent
                        className="mt-2 max-h-[34svh] overflow-y-auto overscroll-contain border-t border-line pt-2 lg:max-h-[30svh]"
                      >
                        <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
                          {projects.map((project, index) => {
                            const isSelected = selectedIndex === index;
                            return (
                              <li key={project.slug} className="min-w-0">
                                <button
                                  type="button"
                                  aria-pressed={isSelected}
                                  aria-label={`${project.index}, ${project.name}, ${project.category}`}
                                  onClick={() => handleSelect(index)}
                                  className={cn(
                                    "flex min-h-10 w-full items-center gap-2 border px-2 py-1.5 text-left transition-colors",
                                    isSelected
                                      ? "border-paper/60 bg-paper/[0.06] text-paper"
                                      : "border-line text-silver hover:border-line-strong hover:text-paper",
                                  )}
                                >
                                  <span className="font-mono text-[9px] tracking-[0.14em] text-ash">
                                    {project.index}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[10px] font-medium tracking-tight sm:text-[11px]">
                                      {project.name}
                                    </span>
                                    <span className="mt-0.5 block truncate font-mono text-[8px] tracking-[0.08em] text-ash">
                                      {project.category}
                                    </span>
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <ul className="mt-2.5 grid grid-cols-5 gap-1.5">
                    {projects.map((project, index) => {
                      const isSelected = selectedIndex === index;
                      return (
                        <li key={project.slug} className="min-w-0">
                          <button
                            type="button"
                            aria-pressed={isSelected}
                            aria-label={`${project.index}, ${project.name}, ${project.category}`}
                            onClick={() => handleSelect(index)}
                            className={cn(
                              "flex h-10 w-full flex-col justify-center gap-0.5 border px-2 text-left transition-colors sm:h-11 sm:px-3",
                              isSelected
                                ? "border-paper/60 bg-paper/[0.06] text-paper"
                                : "border-line text-silver hover:border-line-strong hover:text-paper",
                            )}
                          >
                            <span className="font-mono text-[9px] tracking-[0.14em] text-ash">
                              {project.index}
                            </span>
                            <span className="w-full truncate text-[10px] font-medium tracking-tight sm:text-[11px]">
                              <span className="sm:hidden">
                                {project.name.split(" ")[0]}
                              </span>
                              <span className="hidden sm:inline">
                                {project.name}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {debug ? (
            <VortexDebug
              handleRef={debugHandleRef}
              inputRef={inputRef}
              reduced={reduced}
              sceneActive={sceneActive}
            />
          ) : null}

          <p className="sr-only" role="status" aria-live="polite">
            {announcement}
          </p>
        </div>
      </div>
    </section>
  );
}
