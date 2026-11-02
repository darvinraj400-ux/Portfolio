"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import StudioEnvironment from "@/components/three/StudioEnvironment";
import {
  buildCardTexture,
  buildSheenTexture,
  type CardPrint,
} from "./card-texture";

type SceneProps = CardPrint & {
  hovered: boolean;
  selected: boolean;
  reduced: boolean;
  pointer: { x: number; y: number };
  onReady: () => void;
  onError: () => void;
};

const BASE_X = 0.055;
const BASE_Y = -0.16;

function SceneInvalidator({
  reduced,
  hovered,
  selected,
}: {
  reduced: boolean;
  hovered: boolean;
  selected: boolean;
}) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    invalidate();
  }, [invalidate, reduced, hovered, selected]);

  return null;
}

function Card({
  titleLines,
  category,
  index,
  total,
  hovered,
  selected,
  reduced,
  pointer,
  onReady,
  onError,
}: SceneProps) {
  const print = useMemo<CardPrint>(
    () => ({ titleLines, category, index, total }),
    [titleLines, category, index, total],
  );

  const outerGeometry = useMemo(
    () => new RoundedBoxGeometry(2.436, 3.036, 0.14, 6, 0.062),
    [],
  );
  const innerGeometry = useMemo(
    () => new RoundedBoxGeometry(2.412, 3.012, 0.16, 6, 0.058),
    [],
  );

  const rimMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#c9c9c9"),
        metalness: 1,
        roughness: 0.2,
        envMapIntensity: 1.6,
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 0.08,
      }),
    [],
  );

  const glassMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#101012"),
        metalness: 0.55,
        roughness: 0.22,
        clearcoat: 0.6,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.2,
      }),
    [],
  );

  const printMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#ffffff"),
        metalness: 0.18,
        roughness: 0.34,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.3,
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 0.28,
      }),
    [],
  );

  const innerMaterials = useMemo(
    () => [
      glassMaterial,
      glassMaterial,
      glassMaterial,
      glassMaterial,
      printMaterial,
      glassMaterial,
    ],
    [glassMaterial, printMaterial],
  );

  const sheenGeometry = useMemo(() => new THREE.PlaneGeometry(2.38, 2.97), []);
  const sheenMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const group = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const [sheen, setSheen] = useState<THREE.CanvasTexture | null>(null);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const next = buildSheenTexture();
    setSheen(next);
    return () => {
      next.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sheen) return;
    sheenMaterial.map = sheen;
    sheenMaterial.opacity = 0.42;
    sheenMaterial.needsUpdate = true;
    invalidate();
  }, [sheen, sheenMaterial, invalidate]);

  useEffect(() => {
    let cancelled = false;

    buildCardTexture(print)
      .then((next) => {
        if (cancelled) {
          next.dispose();
          return;
        }
        setTexture(next);
        onReady();
      })
      .catch(() => {
        if (!cancelled) onError();
      });

    return () => {
      cancelled = true;
    };
  }, [print, onReady, onError]);

  useEffect(() => {
    if (!texture) return;
    printMaterial.map = texture;
    printMaterial.emissiveMap = texture;
    printMaterial.needsUpdate = true;
    invalidate();
  }, [texture, printMaterial, invalidate]);

  useEffect(
    () => () => {
      texture?.dispose();
    },
    [texture],
  );

  useEffect(
    () => () => {
      outerGeometry.dispose();
      innerGeometry.dispose();
      sheenGeometry.dispose();
      rimMaterial.dispose();
      glassMaterial.dispose();
      printMaterial.dispose();
      sheenMaterial.dispose();
    },
    [
      outerGeometry,
      innerGeometry,
      sheenGeometry,
      rimMaterial,
      glassMaterial,
      printMaterial,
      sheenMaterial,
    ],
  );

  useFrame((state, delta) => {
    const card = group.current;
    if (!card) return;

    const frame = Math.min(delta, 1 / 20);
    const lift = hovered ? (selected ? 0.18 : 0.14) : selected ? 0.08 : 0;
    const scale = selected ? 1.035 : hovered ? 1.025 : 1;
    const glow = selected ? 0.62 : hovered ? 0.38 : 0.08;
    const sheenTarget = selected ? 0.52 : hovered ? 0.47 : 0.4;

    if (reduced) {
      card.position.set(0, lift, 0);
      card.rotation.set(BASE_X, BASE_Y, 0);
      card.scale.setScalar(scale);
      rimMaterial.emissiveIntensity = glow;
      sheenMaterial.opacity = sheenTarget;
      return;
    }

    const time = state.clock.elapsedTime;
    const calm = hovered || selected ? 0.4 : 1;
    const pointerX = THREE.MathUtils.clamp(pointer.x, -1, 1);
    const pointerY = THREE.MathUtils.clamp(pointer.y, -1, 1);
    const pointerWeight = hovered ? 1 : 0.25;

    const targetY = lift + Math.sin(time * 0.55) * 0.035 * calm;
    const targetX = Math.sin(time * 0.37 + 0.9) * 0.012 * calm;
    const targetRx =
      BASE_X +
      Math.sin(time * 0.31 + 1.6) * 0.02 * calm -
      pointerY * 0.09 * pointerWeight;
    const targetRy =
      BASE_Y +
      Math.sin(time * 0.23 + 0.5) * 0.045 * calm +
      pointerX * 0.13 * pointerWeight;
    const targetRz = Math.sin(time * 0.19 + 2.4) * 0.008 * calm;

    card.position.x = THREE.MathUtils.damp(
      card.position.x,
      targetX,
      3.2,
      frame,
    );
    card.position.y = THREE.MathUtils.damp(
      card.position.y,
      targetY,
      4.2,
      frame,
    );
    card.rotation.x = THREE.MathUtils.damp(
      card.rotation.x,
      targetRx,
      4,
      frame,
    );
    card.rotation.y = THREE.MathUtils.damp(
      card.rotation.y,
      targetRy,
      4,
      frame,
    );
    card.rotation.z = THREE.MathUtils.damp(
      card.rotation.z,
      targetRz,
      3,
      frame,
    );

    const dampedScale = THREE.MathUtils.damp(
      card.scale.x,
      scale,
      6,
      frame,
    );
    card.scale.setScalar(dampedScale);

    rimMaterial.emissiveIntensity = THREE.MathUtils.damp(
      rimMaterial.emissiveIntensity,
      glow,
      7,
      frame,
    );

    sheenMaterial.opacity = THREE.MathUtils.damp(
      sheenMaterial.opacity,
      sheenTarget,
      6,
      frame,
    );
  });

  return (
    <group ref={group} rotation={[BASE_X, BASE_Y, 0]}>
      <mesh geometry={outerGeometry} material={rimMaterial} />
      <mesh geometry={innerGeometry} material={innerMaterials} />
      <mesh
        geometry={sheenGeometry}
        material={sheenMaterial}
        position={[0, 0, 0.0835]}
        renderOrder={3}
      />
    </group>
  );
}

export default function ProjectCardScene(props: SceneProps) {
  const { reduced, hovered, selected } = props;

  return (
    <div aria-hidden="true" className="h-full w-full">
      <Canvas
        frameloop={reduced ? "demand" : "always"}
        dpr={[1, 1.75]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        camera={{ fov: 28, position: [0, 0.18, 7.3], near: 0.1, far: 30 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.setClearAlpha(0);
        }}
        style={{ pointerEvents: "none", background: "transparent" }}
      >
        <StudioEnvironment />
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[-4, 6, 6]}
          intensity={2.6}
          color="#ffffff"
        />
        <directionalLight
          position={[5, 0, 4]}
          intensity={1.1}
          color="#e6e9ec"
        />
        <Card {...props} />
        <SceneInvalidator
          reduced={reduced}
          hovered={hovered}
          selected={selected}
        />
      </Canvas>
    </div>
  );
}
