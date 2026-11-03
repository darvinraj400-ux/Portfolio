"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import InspectorLight, {
  SCENE_EXPOSURE,
} from "@/components/three/InspectorLight";
import StudioEnvironment from "@/components/three/StudioEnvironment";
import { reportCardHover } from "@/lib/cursor-signal";
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
      console.error("WebGL context lost; switching to the static archive.");
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
  const rig = useRef<THREE.Group>(null);
  const spinTarget = useRef(0);
  const drag = useRef<{ id: number; x: number } | null>(null);
  const wasReduced = useRef(reduced);

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
    if (wasReduced.current && !reduced) {
      world.rotateFrozen(rig.current?.rotation.y ?? 0);
      if (rig.current) rig.current.rotation.y = 0;
      spinTarget.current = 0;
    }
    wasReduced.current = reduced;
    world.setReduced(reduced);
    invalidate();
  }, [invalidate, reduced, world]);

  useEffect(() => {
    if (!reduced) return;
    const element = gl.domElement;
    element.style.cursor = "grab";

    const down = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      drag.current = { id: event.pointerId, x: event.clientX };
      element.style.cursor = "grabbing";
    };
    const move = (event: PointerEvent) => {
      const current = drag.current;
      if (!current || current.id !== event.pointerId) return;
      const dx = event.clientX - current.x;
      current.x = event.clientX;
      spinTarget.current = THREE.MathUtils.clamp(
        spinTarget.current + dx * 0.004,
        -1.1,
        1.1,
      );
      invalidate();
    };
    const end = (event: PointerEvent) => {
      if (!drag.current || drag.current.id !== event.pointerId) return;
      drag.current = null;
      element.style.cursor = "grab";
    };

    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", end);
    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", end);
      element.removeEventListener("pointercancel", end);
      element.style.cursor = "";
    };
  }, [gl, invalidate, reduced]);

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
    const group = rig.current;
    if (!reduced || !group) return;
    group.rotation.y = THREE.MathUtils.damp(
      group.rotation.y,
      spinTarget.current,
      10,
      Math.min(delta, 0.1),
    );
    if (Math.abs(group.rotation.y - spinTarget.current) > 0.0004) {
      invalidate();
    } else {
      group.rotation.y = spinTarget.current;
    }
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

      <group ref={rig}>
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
      </group>
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
        setWorld(created);
      })
      .catch((error) => {
        console.error("3D scene failed to start.", error);
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
        setAtlas(next);
      })
      .catch((error) => {
        console.error("Project textures failed to build.", error);
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
