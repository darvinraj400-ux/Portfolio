"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { Theme } from "@/lib/theme";
import type { VortexEnvironment } from "@/lib/vortex-config";
import type { VortexWorld } from "@/lib/vortex-physics";
import type { VortexLampReport } from "@/lib/vortex-types";

export const SCENE_EXPOSURE = 1;

const EXPOSURE_FROM = 0.92;
const SETTLE_SECONDS = 0.7;
const LAMP_BASE = 14;
const LAMP_X = 6.2;
const LAMP_Y = 4.2;
const LAMP_Z = 6.5;
const LAMP_TAU = 0.14;
const BACKLIGHT = 16;
const ENERGY_GAIN = 0.1;
const SELECTION_DIP = 0.06;

type InspectorLightProps = {
  world: VortexWorld;
  environment: VortexEnvironment;
  theme: Theme;
  reduced: boolean;
  enabled: boolean;
  backlight: RefObject<THREE.PointLight | null>;
  report: RefObject<(() => VortexLampReport) | null>;
};

/**
 * One shadowless silver lamp that follows the pointer with 140ms of inertia,
 * plus the energy/selection response shared by all profiles.
 */
export default function InspectorLight({
  world,
  environment,
  theme,
  reduced,
  enabled,
  backlight,
  report,
}: InspectorLightProps) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const lamp = useRef<THREE.PointLight>(null);
  const pointer = useRef({ x: 0, y: 0.2 });
  const settle = useRef(0);
  const active = enabled && environment.id === "desktop" && !reduced;
  const isLight = theme === "light";
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const isLight = themeRef.current === "light";
    settle.current = 0;
    scene.environmentIntensity = isLight ? 0.82 : 1;
    if (backlight.current) {
      backlight.current.intensity = isLight ? 11 : BACKLIGHT;
    }
    gl.toneMappingExposure = reduced ? SCENE_EXPOSURE : EXPOSURE_FROM;
    if (reduced) settle.current = SETTLE_SECONDS;
  }, [backlight, gl, reduced, scene]);

  useEffect(() => {
    scene.environmentIntensity = isLight ? 0.82 : 1;
    if (backlight.current) {
      backlight.current.intensity = isLight ? 11 : BACKLIGHT;
    }
  }, [backlight, isLight, scene]);

  useEffect(() => {
    report.current = () => {
      const light = lamp.current;
      return {
        enabled: active,
        intensity: light?.intensity ?? 0,
        position: light
          ? [light.position.x, light.position.y, light.position.z]
          : [0, 0.2, LAMP_Z],
        environmentIntensity: scene.environmentIntensity,
        backlight: backlight.current?.intensity ?? BACKLIGHT,
        exposure: gl.toneMappingExposure,
        energy: reduced ? 0 : world.energyLevel,
        selected: reduced ? false : world.selectedProjectIndex !== null,
      };
    };
    return () => {
      report.current = null;
    };
  }, [active, backlight, gl, reduced, report, scene, world]);

  useFrame((state, delta) => {
    if (reduced) return;
    const dt = Math.min(delta, 0.1);

    if (settle.current < SETTLE_SECONDS) {
      settle.current += dt;
      const progress = Math.min(1, settle.current / SETTLE_SECONDS);
      const ease = 1 - (1 - progress) ** 3;
      gl.toneMappingExposure =
        EXPOSURE_FROM + (SCENE_EXPOSURE - EXPOSURE_FROM) * ease;
    }

    const energy = world.energyLevel;
    const backlightBase = isLight ? 11 : BACKLIGHT;
    const environmentBase = isLight ? 0.82 : 1;
    if (backlight.current) {
      backlight.current.intensity = backlightBase * (1 + energy * ENERGY_GAIN);
    }
    const dip = world.selectedProjectIndex !== null ? SELECTION_DIP : 0;
    scene.environmentIntensity = Math.max(
      0.7,
      environmentBase + energy * ENERGY_GAIN - dip,
    );

    const light = lamp.current;
    if (!light) return;
    const targetX = state.pointer.x * LAMP_X;
    const targetY = 0.2 + state.pointer.y * LAMP_Y;
    const ease = 1 - Math.exp(-dt / LAMP_TAU);
    pointer.current.x += (targetX - pointer.current.x) * ease;
    pointer.current.y += (targetY - pointer.current.y) * ease;
    light.position.set(pointer.current.x, pointer.current.y, LAMP_Z);
    const reach = Math.hypot(
      pointer.current.x / LAMP_X,
      (pointer.current.y - 0.2) / LAMP_Y,
    );
    const proximity = 1 - Math.min(1, reach);
    light.intensity = LAMP_BASE * (0.45 + 0.55 * proximity);
  });

  if (!active) return null;

  return (
    <pointLight
      ref={lamp}
      position={[0, 0.2, LAMP_Z]}
      intensity={LAMP_BASE * 0.45}
      distance={22}
      decay={2}
      color="#f2f4f6"
    />
  );
}
