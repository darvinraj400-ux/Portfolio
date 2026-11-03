"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import InspectorLight, {
  SCENE_EXPOSURE,
} from "@/components/three/InspectorLight";
import StudioEnvironment from "@/components/three/StudioEnvironment";
import { reportCardHover } from "@/lib/cursor-signal";
import { trace } from "@/lib/diag-trace";
import { VortexWorld } from "@/lib/vortex-physics";
import type { Theme } from "@/lib/theme";
import type { VortexEnvironment } from "@/lib/vortex-config";
import { PROJECT_COUNT } from "@/lib/projects";
import {
  VORTEX_SCENE_VERSION,
  loadVortexScene,
  saveVortexScene,
} from "@/lib/vortex-state";
import type {
  VortexDebugHandle,
  VortexInput,
  VortexLampReport,
  VortexProject,
  VortexSceneState,
} from "@/lib/vortex-types";
import VortexCard, { type VortexVisualState } from "./VortexCard";
import {
  buildVortexAtlas,
  buildVortexSheenTexture,
  type VortexAtlas,
} from "./vortex-texture";

type VortexCanvasProps = {
  projects: VortexProject[];
  environment: VortexEnvironment;
  theme: Theme;
  selectedIndex: number | null;
  reduced: boolean;
  active: boolean;
  input: VortexInput;
  onSelect: (index: number | null) => void;
  onReady: () => void;
  onError: () => void;
  onDebugHandle: (handle: VortexDebugHandle | null) => void;
};

type WorldProps = Omit<VortexCanvasProps, "active" | "onDebugHandle"> & {
  world: VortexWorld;
  atlas: VortexAtlas;
  sheen: THREE.CanvasTexture;
  onDebugHandle: (handle: VortexDebugHandle | null) => void;
};

function CameraRig({ environment }: { environment: VortexEnvironment }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera;
    const config = environment.camera;
    const aspect = Math.max(size.width / Math.max(size.height, 1), 0.4);
    const compensation =
      environment.id === "desktop" && aspect < 1.08
        ? 1 + (1.08 - aspect) * 0.32
        : 1;

    perspective.fov = config.fov;
    perspective.aspect = aspect;
    perspective.near = config.near;
    perspective.far = config.far;
    perspective.position.set(
      config.position[0],
      config.position[1],
      config.position[2] * compensation,
    );
    perspective.lookAt(
      config.target[0],
      config.target[1],
      config.target[2],
    );
    perspective.updateProjectionMatrix();
    perspective.updateMatrixWorld();
    invalidate();
  }, [camera, environment, invalidate, size.height, size.width]);

  return null;
}

type StageRect = { top: number; height: number };

function buildSceneState(
  world: VortexWorld,
  environment: VortexEnvironment,
  camera: THREE.Camera,
  size: { width: number; height: number },
  dpr: number,
  stage: StageRect,
): VortexSceneState {
  const perspective = camera as THREE.PerspectiveCamera;
  return {
    version: VORTEX_SCENE_VERSION,
    savedAt: Date.now(),
    profile: environment.id,
    population: world.bodies.length,
    viewport: {
      width: size.width,
      height: size.height,
      aspect: size.width / Math.max(size.height, 1),
      dpr,
    },
    camera: {
      position: [
        perspective.position.x,
        perspective.position.y,
        perspective.position.z,
      ],
      target: [...environment.camera.target],
      fov: perspective.fov,
      aspect: perspective.aspect,
      near: perspective.near,
      far: perspective.far,
      zoom: perspective.zoom,
      stageTop: stage.top,
      stageHeight: stage.height,
      scrollY: typeof window === "undefined" ? 0 : window.scrollY,
    },
    world: world.captureState(),
  };
}

function ContextGuard({ onError }: { onError: () => void }) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const element = gl.domElement;
    const handleLost = (event: Event) => {
      event.preventDefault();
      trace("gl:context-lost");
      onError();
    };
    element.addEventListener("webglcontextlost", handleLost);
    return () => element.removeEventListener("webglcontextlost", handleLost);
  }, [gl, onError]);

  return null;
}

function ReadySignal({ onReady }: { onReady: () => void }) {
  const sent = useRef(false);

  useEffect(() => {
    let first = 0;
    let second = 0;
    first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        if (sent.current) return;
        sent.current = true;
        trace("canvas:ready-signal");
        onReady();
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [onReady]);

  return null;
}

function VortexWorldView({
  projects,
  environment,
  theme,
  selectedIndex,
  reduced,
  input,
  onSelect,
  onReady,
  onError,
  onDebugHandle,
  atlas,
  sheen,
  world,
}: WorldProps) {
  const light = theme === "light";
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const dpr = useThree((state) => state.viewport.dpr);
  const visual = useRef<VortexVisualState>({
    hovered: null,
    selected: selectedIndex,
  });
  const stage = useRef<StageRect>({ top: 0, height: 0 });
  const live = useRef({ camera, size, dpr });
  live.current = { camera, size, dpr };
  const [lampEnabled, setLampEnabled] = useState(true);
  const backlight = useRef<THREE.PointLight>(null);
  const lampReport = useRef<(() => VortexLampReport) | null>(null);

  const readScene = useCallback(() => {
    const bounds = gl.domElement.getBoundingClientRect();
    // A save during unmount can report a zero rect; keep the last good rect.
    if (bounds.width > 0 && bounds.height > 0) {
      stage.current = { top: bounds.top, height: bounds.height };
    }
    return buildSceneState(
      world,
      environment,
      live.current.camera,
      live.current.size,
      live.current.dpr,
      stage.current,
    );
  }, [environment, gl, world]);

  useEffect(() => {
    const bounds = gl.domElement.getBoundingClientRect();
    if (bounds.width > 0 && bounds.height > 0) {
      stage.current = { top: bounds.top, height: bounds.height };
    }
  }, [gl]);

  useEffect(() => {
    const save = () => saveVortexScene(readScene());
    window.addEventListener("pagehide", save);
    return () => {
      window.removeEventListener("pagehide", save);
      save();
    };
  }, [readScene]);

  useEffect(() => {
    world.setReduced(reduced);
    invalidate();
  }, [invalidate, reduced, world]);

  useEffect(() => {
    visual.current.selected = selectedIndex;
    world.select(selectedIndex);
    invalidate();
  }, [invalidate, selectedIndex, world]);

  useEffect(() => {
    const handle: VortexDebugHandle = {
      snapshot: () => world.snapshot(),
      restoreTrace: () => world.restoredState,
      scene: () => readScene(),
      inventory: () => world.inventory(),
      collisionReport: () => world.collisionSnapshot(),
      resetCollisionMetrics: () => world.resetCollisionMetrics(),
      applyScenario: (name) => world.applyScenario(name),
      setGust: (energy, direction) => world.setGust(energy, direction),
      select: (index) => onSelect(index),
      setDiagnostics: (enabled) => world.setDiagnostics(enabled),
      setLamp: (enabled) => setLampEnabled(enabled),
      setFrozen: (frozen) => world.setFrozen(frozen),
      lamp: () => lampReport.current?.() ?? null,
    };
    onDebugHandle(handle);
    return () => onDebugHandle(null);
  }, [onDebugHandle, onSelect, readScene, world]);

  useEffect(() => {
    const element = gl.domElement;
    const leave = () => {
      visual.current.hovered = null;
      element.dataset.hover = "false";
      reportCardHover(false);
    };
    element.addEventListener("pointerleave", leave);
    return () => {
      element.removeEventListener("pointerleave", leave);
      delete element.dataset.hover;
    };
  }, [gl]);

  useFrame((_, delta) => {
    world.advance(delta, input);
  });

  return (
    <>
      <StudioEnvironment theme={theme} />
      <CameraRig environment={environment} />
      <ContextGuard onError={onError} />
      <ReadySignal onReady={onReady} />

      <ambientLight intensity={light ? 0.5 : 0.22} />
      <directionalLight
        position={[-6, 8, 9]}
        intensity={light ? 2.1 : 2.5}
        color="#ffffff"
      />
      <directionalLight
        position={[7, 1.5, 6]}
        intensity={light ? 0.75 : 1.05}
        color="#e7ebef"
      />
      <directionalLight
        position={[0, 4, -9]}
        intensity={light ? 0.5 : 0.62}
        color="#dfe4e8"
      />
      <pointLight
        ref={backlight}
        position={[0, 1.2, 11.5]}
        intensity={light ? 11 : 16}
        distance={26}
        decay={2}
        color="#f4f6f8"
      />
      <InspectorLight
        world={world}
        environment={environment}
        theme={theme}
        reduced={reduced}
        enabled={lampEnabled}
        backlight={backlight}
        report={lampReport}
      />

      {projects.map((_, index) => {
        const body = world.bodies[index];
        if (!body) return null;
        return (
          <VortexCard
            key={body.project.slug}
            body={body}
            atlas={atlas}
            sheen={sheen}
            visual={visual}
            reduced={reduced}
            onSelect={onSelect}
          />
        );
      })}
    </>
  );
}

export default function VortexCanvas({
  active,
  reduced,
  projects,
  environment,
  onError,
  ...rest
}: VortexCanvasProps) {
  const [atlas, setAtlas] = useState<VortexAtlas | null>(null);
  const [sheen, setSheen] = useState<THREE.CanvasTexture | null>(null);
  const [world, setWorld] = useState<VortexWorld | null>(null);
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const handleError = useCallback(() => {
    onError();
  }, [onError]);

  useEffect(() => {
    let mounted = true;
    let instance: VortexWorld | null = null;
    setWorld(null);
    const saved = loadVortexScene();
    trace("world:create-start");

    VortexWorld.create(projects, environment, reducedRef.current)
      .then((created) => {
        if (!mounted) {
          created.dispose();
          return;
        }
        if (
          saved &&
          saved.profile === environment.id &&
          saved.population === projects.length
        ) {
          created.restoreState(saved.world);
        }
        instance = created;
        trace("world:create-ok");
        setWorld(created);
      })
      .catch((error) => {
        trace("world:create-error", error);
        if (mounted) handleError();
      });

    return () => {
      mounted = false;
      instance?.dispose();
    };
  }, [environment, handleError, projects]);

  useEffect(() => {
    const texture = buildVortexSheenTexture();
    setSheen(texture);
    return () => {
      texture.dispose();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAtlas(null);
    trace("atlas:build-start");

    buildVortexAtlas(
      projects.map((project) => ({
        titleLines: project.titleLines,
        category: project.category,
        index: project.index,
        total: PROJECT_COUNT,
      })),
      {
        tileWidth: environment.atlas.tileWidth,
        columns: environment.atlas.columns,
      },
    )
      .then((next) => {
        if (cancelled) {
          next.texture.dispose();
          return;
        }
        trace("atlas:build-ok");
        setAtlas(next);
      })
      .catch((error) => {
        trace("atlas:build-error", error);
        if (!cancelled) handleError();
      });

    return () => {
      cancelled = true;
    };
  }, [
    environment.atlas.columns,
    environment.atlas.tileWidth,
    environment.id,
    handleError,
    projects,
  ]);

  useEffect(() => {
    if (!atlas) return;
    return () => {
      atlas.texture.dispose();
    };
  }, [atlas]);

  if (!atlas || !sheen || !world) return null;

  const frameloop = !active ? "never" : reduced ? "demand" : "always";

  return (
    <Canvas
      frameloop={frameloop}
      dpr={environment.camera.dpr}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        stencil: false,
      }}
      camera={{
        fov: environment.camera.fov,
        position: environment.camera.position,
        near: environment.camera.near,
        far: environment.camera.far,
      }}
      onCreated={({ gl }) => {
        trace(
          "gl:created",
          `webgl2=${gl.capabilities.isWebGL2} maxTex=${gl.capabilities.maxTextureSize}`,
        );
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = SCENE_EXPOSURE;
        gl.setClearAlpha(0);
      }}
      onPointerMissed={() => {
        if (rest.selectedIndex !== null) rest.onSelect(null);
      }}
      style={{ touchAction: "pan-y", background: "transparent" }}
    >
      <VortexWorldView
        {...rest}
        projects={projects}
        environment={environment}
        reduced={reduced}
        onError={handleError}
        atlas={atlas}
        sheen={sheen}
        world={world}
      />
    </Canvas>
  );
}
