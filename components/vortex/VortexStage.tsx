"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
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
import { X } from "lucide-react";
import ProjectPlate from "@/components/archive/ProjectPlate";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useSound } from "@/components/audio/SoundProvider";
import ScrambleText from "@/components/motion/ScrambleText";
import { SITE } from "@/lib/constants";
import {
  reportLandingFallback,
  reportLandingStep,
} from "@/lib/landing-ready";
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

  componentDidCatch(error: Error) {
    console.error("3D scene crashed; switching to the static archive.", error);
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
        className={cn(
          "absolute inset-x-0 overflow-hidden",
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

function StaticCover({ project }: { project: VortexProject }) {
  const [failed, setFailed] = useState(false);

  if (!project.cover || failed) return <ProjectPlate id={project.index} />;

  return (
    <Image
      src={project.cover}
      alt={`${project.name} — ${project.category}`}
      fill
      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function StaticProjectBrowser({
  projects,
  home,
}: {
  projects: VortexProject[];
  home: boolean;
}) {
  return (
    <div
      data-vortex-static=""
      className={cn(
        "relative z-10 pb-16 pt-8 sm:pt-10",
        home ? "shell" : "mx-auto w-full max-w-5xl px-4 sm:px-6",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-3">
        <p className="mono-meta text-ash">Selected work / static preview</p>
        <p className="mono-meta text-ash">
          {String(projects.length).padStart(2, "0")} projects
        </p>
      </div>
      <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-silver">
        This browser cannot render the interactive field, so the archive is
        shown instead. Every project remains available here and in the project
        index.
      </p>

      <ul className="mt-8 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <li key={project.slug}>
            <article
              data-project-slug={project.slug}
              className="group relative flex flex-col"
            >
              <Link
                href={`/work/${project.slug}`}
                aria-label={`${project.index}, ${project.name}, ${project.category} — open project page`}
                className="absolute inset-0 z-10"
              />
              <div className="relative aspect-[4/3] overflow-hidden border border-line bg-surface transition-colors duration-300 group-hover:border-line-strong">
                <StaticCover project={project} />
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-4">
                <span className="mono-meta text-ash">{project.index}</span>
                <span className="mono-meta text-right text-ash">
                  {project.category}
                </span>
              </div>
              <h3 className="mt-2 text-base font-medium tracking-tight text-paper sm:text-lg">
                {project.name}
              </h3>
              {project.shortDescription ? (
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-silver">
                  {project.shortDescription}
                </p>
              ) : null}
            </article>
          </li>
        ))}
      </ul>
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
  const panelTitleId = useId();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [panelProject, setPanelProject] = useState<VortexProject | null>(null);
  const [panelShown, setPanelShown] = useState(false);
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const [webglStatus, setWebglStatus] = useState<WebGLStatus>("checking");
  const [queryReady, setQueryReady] = useState(false);
  const [forcedFallback, setForcedFallback] = useState(false);
  const [debug, setDebug] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const panelTimerRef = useRef<number | null>(null);
  const indexToggleRef = useRef<HTMLButtonElement>(null);
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
  const permanentFallback =
    queryReady && (forcedFallback || webglStatus === "unavailable" || sceneFailed);
  // The contact sheet is only the boot placeholder; permanent fallback uses
  // the readable archive below the hero.
  const showBootFallback = !showingScene && !permanentFallback;
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
    const target = selectedProject;
    if (panelProject && target?.slug === panelProject.slug) {
      if (panelTimerRef.current !== null) {
        window.clearTimeout(panelTimerRef.current);
        panelTimerRef.current = null;
        setPanelShown(true);
      }
      return;
    }
    if (panelTimerRef.current !== null) {
      window.clearTimeout(panelTimerRef.current);
      panelTimerRef.current = null;
    }
    if (!panelProject) {
      if (target) setPanelProject(target);
      return;
    }
    setPanelShown(false);
    panelTimerRef.current = window.setTimeout(
      () => {
        panelTimerRef.current = null;
        setPanelProject(target);
      },
      reduced ? 0 : 220,
    );
  }, [panelProject, reduced, selectedProject]);

  useEffect(() => {
    if (
      !panelProject ||
      !selectedProject ||
      selectedProject.slug !== panelProject.slug
    ) {
      return;
    }
    if (panelShown) return;
    const frame = requestAnimationFrame(() => setPanelShown(true));
    return () => cancelAnimationFrame(frame);
  }, [panelProject, panelShown, selectedProject]);

  useEffect(
    () => () => {
      if (panelTimerRef.current !== null) {
        window.clearTimeout(panelTimerRef.current);
      }
    },
    [],
  );

  const closePanel = () => {
    const hadFocus =
      panelRef.current?.contains(document.activeElement) ?? false;
    handleSelect(null);
    if (hadFocus) {
      requestAnimationFrame(() => indexToggleRef.current?.focus());
    }
  };

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
    const available = supportsWebGL();
    setWebglStatus(available ? "available" : "unavailable");
  }, [forcedFallback, queryReady]);

  useEffect(() => {
    if (!queryReady || !permanentFallback) return;
    reportLandingFallback();
  }, [permanentFallback, queryReady]);

  // Rapier or WebGL can stall without throwing. A scene that has produced no
  // frame by now is not going to; the static archive is the reliable entry.
  useEffect(() => {
    if (!documentVisible || !sceneActive || sceneReady || sceneFailed) return;
    const timer = window.setTimeout(() => {
      console.warn(
        "3D scene produced no frame within 10s; switching to the static archive.",
      );
      setSceneFailed(true);
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [documentVisible, sceneActive, sceneFailed, sceneReady]);

  useEffect(() => {
    setSceneReady(false);
  }, [environment.id]);

  // In the static archive the index is the only way in, so reveal the panel
  // instead of leaving the index covering it.
  useEffect(() => {
    if (!permanentFallback || selectedIndex === null) return;
    setIndexOpen(false);
  }, [permanentFallback, selectedIndex]);

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
      const insidePanel =
        panelRef.current?.contains(document.activeElement) ?? false;
      event.preventDefault();
      setSelectedIndex(null);
      setAnnouncement("Selection cleared.");
      if (insidePanel) {
        requestAnimationFrame(() => indexToggleRef.current?.focus());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!active) inputRef.current.pointerActive = false;
  }, [active]);

  const handleSceneReady = useCallback(() => {
    setSceneReady(true);
    reportLandingStep("frame");
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

  const panelOpen = panelShown && !indexOpen;

  return (
    <section
      id={home ? "top" : undefined}
      aria-labelledby={headingId}
      className="relative isolate"
    >
      <div
        className={cn(
          "relative",
          permanentFallback
            ? ""
            : home
              ? "h-[190svh] lg:h-[220svh]"
              : "h-[220svh] lg:h-[280svh]",
        )}
      >
        <div
          ref={stageRef}
          data-render={showingScene ? "webgl" : "fallback"}
          data-static={permanentFallback ? "true" : undefined}
          data-profile={profile}
          data-population={projects.length}
          data-reduced={reduced ? "true" : "false"}
          data-selected={selectedIndex ?? "none"}
          className={cn(
            "flex flex-col bg-background",
            permanentFallback
              ? "relative min-h-[calc(100svh-4rem)]"
              : "sticky top-16 h-[calc(100svh-4rem)] overflow-hidden",
          )}
          onPointerMoveCapture={handlePointerMove}
          onPointerLeave={resetPointer}
        >
          {permanentFallback ? null : (
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(78% 64% at 50% 42%, var(--vortex-core) 0%, var(--vortex-mid) 58%, var(--vortex-edge) 100%)",
              }}
            />
          )}

          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0",
              sceneActive ? "vortex-scene-layer" : "opacity-0",
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

          {showBootFallback ? (
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

          {reduced && !permanentFallback ? (
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
            <div
              className={cn(
                "hero-plate pointer-events-none z-20 bg-gradient-to-b from-background via-background/88 to-transparent pb-14 sm:pb-20",
                permanentFallback
                  ? "relative"
                  : "absolute inset-x-0 top-0",
              )}
            >
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
                      {permanentFallback
                        ? "WebGL is unavailable. Every project is listed in the static archive below and in the project index."
                        : reduced
                          ? "Reduced motion is on. Drag the field to look around, or choose a project from the index to inspect it."
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
                "pointer-events-none z-20 bg-gradient-to-b from-background to-transparent pb-28",
                permanentFallback
                  ? "relative"
                  : "absolute inset-x-0 top-0",
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
                    {permanentFallback
                      ? `${projects.length} projects, listed as an archive`
                      : full
                        ? `${projects.length} cards in an invisible vortex`
                        : "Five cards in an invisible vortex"}
                  </h1>
                  <p
                    id={instructionsId}
                    className="mt-1.5 text-[12px] leading-relaxed text-silver sm:text-[13px]"
                  >
                    {permanentFallback
                      ? "WebGL is unavailable. Every project is listed below; open the index to inspect one."
                      : reduced
                        ? "Reduced motion is on. Drag to look around; use the index to inspect each card."
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

          {permanentFallback ? (
            <StaticProjectBrowser projects={projects} home={home} />
          ) : null}

          {panelProject ? (
            <aside
              ref={panelRef}
              aria-labelledby={panelTitleId}
              data-vortex-panel=""
              inert={!panelOpen}
              className={cn(
                "pointer-events-auto inset-x-3 bottom-[10rem] mx-auto w-auto max-w-[30rem] overflow-hidden rounded-[10px] border border-white/15 bg-[#08080a]/90 text-[#e8e8e8] shadow-[0_32px_90px_-32px_rgba(0,0,0,0.95)] backdrop-blur-xl transition-[opacity,transform] ease-out",
                "lg:inset-x-auto lg:right-6 lg:bottom-[9.5rem] lg:mx-0 lg:w-[21rem] lg:max-w-none xl:w-[22rem]",
                permanentFallback ? "fixed z-40" : "absolute z-30",
                panelOpen
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0",
              )}
              style={{
                transitionDuration: reduced
                  ? "0ms"
                  : panelShown
                    ? "320ms"
                    : "220ms",
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
              <div key={panelProject.slug} className="relative p-3 sm:p-4">
                <button
                  type="button"
                  onClick={closePanel}
                  aria-label="Close project details"
                  className="absolute right-2 top-2 z-10 inline-flex size-9 items-center justify-center rounded-full border border-white/10 text-white/55 transition-colors hover:border-white/30 hover:text-white"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
                <div className="grid grid-cols-[36%_1fr] gap-3">
                  <div
                    className={cn(
                      "relative aspect-[4/3] self-start overflow-hidden rounded-[6px] border border-white/10 bg-[#060607]",
                      reduced ? "" : "vortex-panel-item",
                    )}
                    style={reduced ? undefined : { animationDelay: "80ms" }}
                  >
                    {panelProject.cover &&
                    failedCover !== panelProject.slug ? (
                      <Image
                        src={panelProject.cover}
                        alt={`${panelProject.name} cover`}
                        fill
                        sizes="(min-width: 1024px) 7.5rem, 36vw"
                        className="object-contain"
                        onError={() => setFailedCover(panelProject.slug)}
                      />
                    ) : (
                      <ProjectPlate id={panelProject.index} />
                    )}
                  </div>
                  <div className="min-w-0 pr-9">
                    <p
                      className={cn(
                        "truncate font-mono text-[9px] uppercase tracking-[0.16em] text-white/45",
                        reduced ? "" : "vortex-panel-item",
                      )}
                    >
                      {panelProject.index} — {panelProject.category}
                    </p>
                    <h2
                      id={panelTitleId}
                      className={cn(
                        "mt-1 truncate text-[14px] font-medium tracking-tight text-white",
                        reduced ? "" : "vortex-panel-item",
                      )}
                      style={reduced ? undefined : { animationDelay: "40ms" }}
                    >
                      {panelProject.name}
                    </h2>
                    {panelProject.shortDescription ? (
                      <p
                        className={cn(
                          "mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-white/65 lg:line-clamp-3",
                          reduced ? "" : "vortex-panel-item",
                        )}
                        style={reduced ? undefined : { animationDelay: "100ms" }}
                      >
                        {panelProject.shortDescription}
                      </p>
                    ) : null}
                    <Link
                      href={`/work/${panelProject.slug}`}
                      aria-label={`View project: ${panelProject.name}`}
                      className={cn(
                        "mt-2.5 inline-flex h-8 w-full items-center justify-center gap-1.5 bg-white px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#08080a] transition-colors hover:bg-[#c9c9cb]",
                        reduced ? "" : "vortex-panel-item",
                      )}
                      style={reduced ? undefined : { animationDelay: "150ms" }}
                    >
                      View project
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          ) : null}

          <div
            className={cn(
              "inset-x-0 bottom-0 z-20",
              permanentFallback ? "sticky mt-auto" : "absolute",
            )}
          >
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
                        ref={indexToggleRef}
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
