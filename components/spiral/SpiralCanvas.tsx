"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  buildCardAtlas,
  buildSheenTexture,
  type CardAtlas,
} from "@/components/prototype/card-texture";
import StudioEnvironment from "@/components/three/StudioEnvironment";
import {
  buildSpiralLayout,
  spiralSlot,
  type SpiralLayout,
  type SpiralProfileName,
  type SpiralProject,
} from "@/lib/spiral";

type SpiralCanvasProps = {
  projects: SpiralProject[];
  profile: SpiralProfileName;
  selectedIndex: number | null;
  previewIndex: number | null;
  reduced: boolean;
  active: boolean;
  onSelect: (projectIndex: number) => void;
  onReady: () => void;
  onError: () => void;
};

type SpiralWorldProps = SpiralCanvasProps & {
  atlas: CardAtlas;
  layout: SpiralLayout;
};

type Weight = { hover: number; selected: number; dim: number; neighbour: number };

const CARD_WIDTH = 2.436;
const CARD_HEIGHT = 3.036;
const CARD_DEPTH = 0.14;
const INNER_WIDTH = 2.412;
const INNER_HEIGHT = 3.012;
const INNER_DEPTH = 0.16;
const PRINT_WIDTH = 2.3;
const PRINT_HEIGHT = 2.88;
const PRINT_Z = 0.087;

const CARD_HALF_WIDTH = CARD_WIDTH / 2;
const CARD_HALF_HEIGHT = CARD_HEIGHT / 2;

const IDLE_SPEED = 0.055;

function wrapAngle(value: number): number {
  return Math.atan2(Math.sin(value), Math.cos(value));
}

function damp(current: number, target: number, lambda: number, delta: number) {
  return THREE.MathUtils.damp(current, target, lambda, delta);
}

function remapUvs(
  geometry: THREE.BufferGeometry,
  rect: { u0: number; v0: number; u1: number; v1: number },
) {
  const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;
  for (let index = 0; index < uv.count; index += 1) {
    uv.setXY(
      index,
      rect.u0 + uv.getX(index) * (rect.u1 - rect.u0),
      rect.v0 + uv.getY(index) * (rect.v1 - rect.v0),
    );
  }
  uv.needsUpdate = true;
}

function CameraRig({
  layout,
  profile,
}: {
  layout: SpiralLayout;
  profile: SpiralProfileName;
}) {
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera;
    const fov = profile === "mobile" ? 38 : 33;
    const tanV = Math.tan(THREE.MathUtils.degToRad(fov / 2));

    perspective.fov = fov;
    perspective.aspect = Math.max(size.width / size.height, 0.4);
    perspective.near = 0.1;
    perspective.far = 80;
    perspective.updateProjectionMatrix();

    const corners: THREE.Vector3[] = [];
    for (const card of layout.cards) {
      const x = Math.sin(card.angle) * card.radius;
      const z = Math.cos(card.angle) * card.radius;
      const tangentX = Math.cos(card.angle);
      const tangentZ = -Math.sin(card.angle);
      const halfWidth = CARD_HALF_WIDTH * card.scale * 1.02;
      const halfHeight = CARD_HALF_HEIGHT * card.scale * 1.02;
      for (const sx of [-1, 1]) {
        for (const sy of [-1, 1]) {
          corners.push(
            new THREE.Vector3(
              x + tangentX * halfWidth * sx,
              card.y + halfHeight * sy,
              z + tangentZ * halfWidth * sx,
            ),
          );
        }
      }
    }

    const projected = new THREE.Vector3();
    const rotatedCorner = new THREE.Vector3();
    // The world group spins, so fit the worst case over a full turn rather
    // than the resting pose; otherwise cards graze the frame edges as it turns.
    const ROTATION_SAMPLES = 30;
    const bounds = (distance: number, lookY: number) => {
      perspective.position.set(0, 0.05, distance);
      perspective.lookAt(0, lookY, 0);
      perspective.updateMatrixWorld();
      let maxAbsX = 0;
      let minY = Infinity;
      let maxY = -Infinity;
      for (let step = 0; step < ROTATION_SAMPLES; step += 1) {
        const theta = (step / ROTATION_SAMPLES) * Math.PI * 2;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        for (const corner of corners) {
          rotatedCorner.set(
            corner.x * cos + corner.z * sin,
            corner.y,
            -corner.x * sin + corner.z * cos,
          );
          projected.copy(rotatedCorner).project(perspective);
          maxAbsX = Math.max(maxAbsX, Math.abs(projected.x));
          minY = Math.min(minY, projected.y);
          maxY = Math.max(maxY, projected.y);
        }
      }
      return {
        centerY: (minY + maxY) / 2,
        halfX: maxAbsX,
        halfY: (maxY - minY) / 2,
      };
    };

    let distance = 24;
    let lookY = 0;
    for (let pass = 0; pass < 3; pass += 1) {
      const current = bounds(distance, lookY);
      const ratio = Math.max(current.halfX / 0.94, current.halfY / 0.88);
      distance = THREE.MathUtils.clamp(
        distance * THREE.MathUtils.clamp(ratio, 0.7, 1.4),
        8,
        40,
      );
      const centered = bounds(distance, lookY);
      lookY += centered.centerY * tanV * distance;
    }

    // Mobile deliberately crops the structure so a few foreground cards read large.
    if (profile === "mobile") {
      distance *= 0.8;
      const cropped = bounds(distance, lookY);
      lookY += cropped.centerY * tanV * distance;
    }

    const fog = new THREE.Fog("#000000", distance * 0.8, distance * 2);
    scene.fog = fog;

    perspective.position.set(0, 0.05, distance);
    perspective.lookAt(0, lookY, 0);
    perspective.updateProjectionMatrix();
    perspective.updateMatrixWorld();
    invalidate();

    return () => {
      if (scene.fog === fog) scene.fog = null;
    };
  }, [camera, invalidate, layout, profile, scene, size.height, size.width]);

  return null;
}

function ReadySignal({ onReady }: { onReady: () => void }) {
  const sent = useRef(false);

  useFrame(() => {
    if (sent.current) return;
    sent.current = true;
    requestAnimationFrame(onReady);
  });

  return null;
}

function ContextGuard({ onError }: { onError: () => void }) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const element = gl.domElement;
    const handleLost = (event: Event) => {
      event.preventDefault();
      onError();
    };
    element.addEventListener("webglcontextlost", handleLost);
    return () => element.removeEventListener("webglcontextlost", handleLost);
  }, [gl, onError]);

  return null;
}

function SpiralWorld({
  projects,
  profile,
  selectedIndex,
  previewIndex,
  reduced,
  active,
  onSelect,
  onReady,
  onError,
  atlas,
  layout,
}: SpiralWorldProps) {
  const world = useRef<THREE.Group>(null);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const weights = useRef<Weight[]>(
    layout.cards.map(() => ({ hover: 0, selected: 0, dim: 0, neighbour: 0 })),
  );
  const elapsed = useRef(0);
  const motion = useRef({
    angle: 0.62,
    velocity: 0,
    focusTarget: null as number | null,
    focusY: null as number | null,
  });
  const hovered = useRef<number | null>(null);
  const pointerInside = useRef(false);
  const drag = useRef({
    active: false,
    id: -1,
    lastX: 0,
    lastY: 0,
    totalX: 0,
    totalY: 0,
    distance: 0,
  });
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const projected = useRef(new THREE.Vector3());

  const selectedRef = useRef(selectedIndex);
  const previewRef = useRef(previewIndex);
  const reducedRef = useRef(reduced);
  selectedRef.current = selectedIndex;
  previewRef.current = previewIndex;
  reducedRef.current = reduced;

  const resources = useMemo(() => {
    const outerGeometry = new RoundedBoxGeometry(
      CARD_WIDTH,
      CARD_HEIGHT,
      CARD_DEPTH,
      6,
      0.062,
    );
    const innerGeometry = new RoundedBoxGeometry(
      INNER_WIDTH,
      INNER_HEIGHT,
      INNER_DEPTH,
      6,
      0.058,
    );
    const rim = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#c9c9c9"),
      metalness: 1,
      roughness: 0.2,
      envMapIntensity: 1.6,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.08,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#101012"),
      metalness: 0.55,
      roughness: 0.22,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.2,
    });
    const print = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#ffffff"),
      metalness: 0.16,
      roughness: 0.36,
      clearcoat: 0.9,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.15,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.38,
    });
    const sheenGeometry = new THREE.PlaneGeometry(2.38, 2.97);
    const sheenMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    });
    return {
      outerGeometry,
      innerGeometry,
      rim,
      glass,
      print,
      sheenGeometry,
      sheenMaterial,
    };
  }, []);

  const materials = useMemo(
    () =>
      layout.cards.map(() => ({
        rim: resources.rim.clone(),
        print: resources.print.clone(),
      })),
    [layout, resources],
  );

  const printGeometry = useMemo(
    () =>
      layout.cards.map((card) => {
        const geometry = new THREE.PlaneGeometry(PRINT_WIDTH, PRINT_HEIGHT);
        remapUvs(geometry, atlas.uvs[card.slot]);
        return geometry;
      }),
    [atlas, layout],
  );

  useEffect(() => {
    for (const material of materials) {
      material.print.map = atlas.texture;
      material.print.emissiveMap = atlas.texture;
      material.print.needsUpdate = true;
    }
  }, [atlas, materials]);

  const [sheen, setSheen] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const texture = buildSheenTexture();
    setSheen(texture);
    return () => {
      texture.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sheen) return;
    resources.sheenMaterial.map = sheen;
    resources.sheenMaterial.needsUpdate = true;
    invalidate();
  }, [invalidate, resources, sheen]);

  useEffect(
    () => () => {
      for (const material of materials) {
        material.rim.dispose();
        material.print.dispose();
      }
    },
    [materials],
  );

  useEffect(
    () => () => {
      resources.outerGeometry.dispose();
      resources.innerGeometry.dispose();
      resources.rim.dispose();
      resources.glass.dispose();
      resources.print.dispose();
      resources.sheenGeometry.dispose();
      resources.sheenMaterial.dispose();
    },
    [resources],
  );

  useEffect(
    () => () => {
      for (const geometry of printGeometry) geometry.dispose();
    },
    [printGeometry],
  );

  useEffect(() => {
    const element = gl.domElement;
    element.style.touchAction = "pan-y";
    element.style.cursor = "grab";

    const handleDown = (event: PointerEvent) => {
      drag.current = {
        active: true,
        id: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY,
        totalX: 0,
        totalY: 0,
        distance: 0,
      };
      pointerInside.current = true;
      element.style.cursor = "grabbing";
    };

    const handleMove = (event: PointerEvent) => {
      if (!drag.current.active || event.pointerId !== drag.current.id) return;

      const dx = event.clientX - drag.current.lastX;
      const dy = event.clientY - drag.current.lastY;
      drag.current.lastX = event.clientX;
      drag.current.lastY = event.clientY;
      drag.current.totalX += dx;
      drag.current.totalY += dy;
      drag.current.distance += Math.abs(dx) + Math.abs(dy);

      if (selectedRef.current !== null || reducedRef.current) return;

      if (
        event.pointerType === "touch" &&
        Math.abs(drag.current.totalX) > Math.abs(drag.current.totalY) &&
        drag.current.distance > 6
      ) {
        event.preventDefault();
      }

      motion.current.angle += dx * 0.0042;
      motion.current.velocity = THREE.MathUtils.clamp(
        motion.current.velocity + dx * 0.0016,
        -2.1,
        2.1,
      );
    };

    const handleUp = (event: PointerEvent) => {
      if (event.pointerId !== drag.current.id) return;
      drag.current.active = false;
      element.style.cursor = hovered.current !== null ? "pointer" : "grab";
    };

    const handleEnter = () => {
      pointerInside.current = true;
    };

    const handleLeave = () => {
      pointerInside.current = false;
      drag.current.active = false;
      hovered.current = null;
      element.style.cursor = "grab";
      invalidate();
    };

    element.addEventListener("pointerdown", handleDown);
    element.addEventListener("pointermove", handleMove, { passive: false });
    element.addEventListener("pointerup", handleUp);
    element.addEventListener("pointercancel", handleUp);
    element.addEventListener("pointerenter", handleEnter);
    element.addEventListener("pointerleave", handleLeave);

    return () => {
      element.removeEventListener("pointerdown", handleDown);
      element.removeEventListener("pointermove", handleMove);
      element.removeEventListener("pointerup", handleUp);
      element.removeEventListener("pointercancel", handleUp);
      element.removeEventListener("pointerenter", handleEnter);
      element.removeEventListener("pointerleave", handleLeave);
    };
  }, [gl, invalidate]);

  useEffect(() => {
    if (reduced || !active) return;

    let last = window.scrollY;
    const handleScroll = () => {
      const next = window.scrollY;
      const delta = next - last;
      last = next;
      if (delta === 0 || selectedRef.current !== null) return;

      motion.current.velocity = THREE.MathUtils.clamp(
        motion.current.velocity +
          THREE.MathUtils.clamp(delta * 0.0022, -0.14, 0.14),
        -1.7,
        2.0,
      );
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [active, reduced]);

  useEffect(() => {
    if (selectedIndex === null) {
      motion.current.focusTarget = null;
      motion.current.focusY = null;
      invalidate();
      return;
    }

    const slot = spiralSlot(selectedIndex, projects.length);
    const card = layout.cards[slot];
    const current = motion.current.angle;
    const desired = -card.angle;
    const delta = wrapAngle(desired - current);
    const target = current + delta;

    motion.current.focusTarget = target;
    motion.current.focusY = card.y;

    if (reduced) {
      motion.current.angle = target;
      motion.current.velocity = 0;
      if (world.current) {
        world.current.rotation.y = target;
        world.current.position.y = THREE.MathUtils.clamp(
          -card.y * 0.55,
          -2.1,
          2.1,
        );
      }
    }

    invalidate();
  }, [invalidate, layout, projects.length, reduced, selectedIndex]);

  useEffect(() => {
    invalidate();
  }, [active, invalidate, previewIndex, reduced, selectedIndex]);

  useFrame((state, rawDelta) => {
    const group = world.current;
    if (!group) return;

    const dt = Math.min(rawDelta, 1 / 30);
    elapsed.current += dt;

    const selected = selectedRef.current;
    const focusTarget = motion.current.focusTarget;

    if (selected !== null && focusTarget !== null) {
      motion.current.angle = reducedRef.current
        ? focusTarget
        : damp(motion.current.angle, focusTarget, 2.1, dt);
      motion.current.velocity = damp(motion.current.velocity, 0, 7, dt);
    } else if (!reducedRef.current) {
      motion.current.velocity = damp(
        motion.current.velocity,
        IDLE_SPEED,
        1.05,
        dt,
      );
      motion.current.angle += motion.current.velocity * dt;
    }

    group.rotation.y =
      motion.current.angle +
      (selected !== null && !reducedRef.current
        ? Math.sin(elapsed.current * 0.22) * 0.012
        : 0);

    const targetGroupY =
      selected !== null && motion.current.focusY !== null
        ? THREE.MathUtils.clamp(-motion.current.focusY * 0.55, -2.1, 2.1)
        : 0;
    group.position.y = reducedRef.current
      ? targetGroupY
      : damp(group.position.y, targetGroupY, 2.2, dt);

    const hoveredIndex = hovered.current ?? previewRef.current;
    const hoveredSlot =
      hoveredIndex !== null ? spiralSlot(hoveredIndex, projects.length) : null;
    const hoveredCard = hoveredSlot !== null ? layout.cards[hoveredSlot] : null;

    const pointer = state.pointer;
    const aspect = Math.max(state.size.width / state.size.height, 0.4);

    layout.cards.forEach((card, slot) => {
      const cardGroup = groups.current[slot];
      if (!cardGroup) return;

      const weight = weights.current[slot];
      const isSelected = selected === card.projectIndex;
      const isHovered = !isSelected && hoveredIndex === card.projectIndex;

      let neighbourTarget = 0;
      if (hoveredCard && !isSelected && !isHovered) {
        const angular = Math.abs(wrapAngle(card.angle - hoveredCard.angle));
        const vertical = Math.abs(card.y - hoveredCard.y);
        neighbourTarget =
          Math.max(0, 1 - angular / 1.05) *
          Math.max(0, 1 - vertical / 2.4) *
          0.8;
      }

      const hoverTarget = isHovered ? 1 : 0;
      const selectedTarget = isSelected ? 1 : 0;
      const dimTarget = selected !== null && !isSelected ? 1 : 0;

      if (reducedRef.current) {
        weight.hover = hoverTarget;
        weight.selected = selectedTarget;
        weight.dim = dimTarget;
        weight.neighbour = neighbourTarget;
      } else {
        weight.hover = damp(weight.hover, hoverTarget, 8, dt);
        weight.selected = damp(weight.selected, selectedTarget, 5.5, dt);
        weight.dim = damp(weight.dim, dimTarget, 5, dt);
        weight.neighbour = damp(weight.neighbour, neighbourTarget, 4, dt);
      }

      const float =
        reducedRef.current
          ? 0
          : Math.sin(elapsed.current * card.floatSpeed + card.phase) * 0.018;
      const normalX = Math.sin(card.angle);
      const normalZ = Math.cos(card.angle);
      const lift =
        weight.selected * 1.05 + weight.hover * 0.075 + weight.neighbour * 0.012;

      cardGroup.position.x = normalX * card.radius + normalX * lift;
      cardGroup.position.z = normalZ * card.radius + normalZ * lift;
      cardGroup.position.y =
        card.y + float + weight.selected * 0.16 + weight.hover * 0.03;

      const scale =
        card.scale *
        (1 +
          weight.selected * 0.72 +
          weight.hover * 0.035 -
          weight.dim * 0.025 +
          weight.neighbour * 0.008);
      cardGroup.scale.setScalar(scale);

      let pointerTiltX = 0;
      let pointerTiltY = 0;
      if (
        pointerInside.current &&
        !reducedRef.current &&
        selected === null &&
        normalZ > -0.15
      ) {
        const worldAngle = card.angle + motion.current.angle;
        projected.current
          .set(
            Math.sin(worldAngle) * (card.radius + lift),
            card.y + group.position.y,
            Math.cos(worldAngle) * (card.radius + lift),
          )
          .project(camera);
        const dx = (projected.current.x - pointer.x) * aspect;
        const dy = projected.current.y - pointer.y;
        const proximity = Math.max(0, 1 - Math.hypot(dx, dy) / 0.62);
        pointerTiltX = -pointer.y * 0.055 * proximity;
        pointerTiltY = pointer.x * 0.05 * proximity;
      }

      const calm = 1 - weight.selected * 0.9;
      const floatTilt =
        reducedRef.current
          ? 0
          : Math.sin(elapsed.current * 0.31 + card.phase) * 0.008 * calm;

      cardGroup.rotation.set(
        card.pitch * (1 - weight.selected) + floatTilt + pointerTiltX,
        card.angle +
          (reducedRef.current
            ? 0
            : Math.sin(elapsed.current * 0.24 + card.phase) * 0.006 * calm) +
          pointerTiltY,
        0,
        "YXZ",
      );

      const rim = materials[slot].rim;
      rim.emissiveIntensity = Math.max(
        0.02,
        0.08 +
          weight.hover * 0.3 +
          weight.selected * 0.52 +
          weight.neighbour * 0.05 -
          weight.dim * 0.06,
      );
      rim.color.setScalar(1 - weight.dim * 0.5);

      const print = materials[slot].print;
      print.color.setScalar(Math.max(0.2, 1 - weight.dim * 0.72));
      print.emissiveIntensity = Math.max(
        0.06,
        0.38 +
          weight.hover * 0.22 +
          weight.selected * 0.32 -
          weight.dim * 0.16,
      );
    });
  });

  return (
    <>
      <StudioEnvironment />
      <CameraRig layout={layout} profile={profile} />
      <ContextGuard onError={onError} />
      <ReadySignal onReady={onReady} />

      <ambientLight intensity={0.22} />
      <directionalLight
        position={[-5, 7, 8]}
        intensity={2.6}
        color="#ffffff"
      />
      <directionalLight
        position={[6, 1, 6]}
        intensity={1.1}
        color="#e6e9ec"
      />
      <directionalLight
        position={[2, 3, -8]}
        intensity={0.55}
        color="#dfe4e8"
      />

      <group ref={world} rotation={[0, 0.62, 0]}>
        {layout.cards.map((card, slot) => (
          <group
            key={card.slot}
            ref={(element) => {
              groups.current[slot] = element;
            }}
            position={[
              Math.sin(card.angle) * card.radius,
              card.y,
              Math.cos(card.angle) * card.radius,
            ]}
            rotation={[card.pitch, card.angle, 0, "YXZ"]}
          >
            <mesh
              geometry={resources.outerGeometry}
              material={materials[slot].rim}
              onPointerOver={(event) => {
                event.stopPropagation();
                hovered.current = card.projectIndex;
                gl.domElement.style.cursor = "pointer";
                invalidate();
              }}
              onPointerOut={(event) => {
                event.stopPropagation();
                if (hovered.current === card.projectIndex) {
                  hovered.current = null;
                }
                gl.domElement.style.cursor = drag.current.active
                  ? "grabbing"
                  : "grab";
                invalidate();
              }}
              onClick={(event) => {
                event.stopPropagation();
                if (drag.current.distance > 8) return;
                onSelect(card.projectIndex);
              }}
            />
            <mesh
              geometry={resources.innerGeometry}
              material={resources.glass}
              raycast={() => {}}
            />
            <mesh
              geometry={printGeometry[slot]}
              material={materials[slot].print}
              position={[0, 0, PRINT_Z]}
              raycast={() => {}}
            />
            <mesh
              geometry={printGeometry[slot]}
              material={materials[slot].print}
              position={[0, 0, -PRINT_Z]}
              rotation={[0, Math.PI, 0]}
              raycast={() => {}}
            />
            <mesh
              geometry={resources.sheenGeometry}
              material={resources.sheenMaterial}
              position={[0, 0, PRINT_Z + 0.005]}
              renderOrder={3}
              raycast={() => {}}
            />
          </group>
        ))}
      </group>
    </>
  );
}

export default function SpiralCanvas({
  projects,
  profile,
  onError,
  ...rest
}: SpiralCanvasProps) {
  const [atlas, setAtlas] = useState<CardAtlas | null>(null);

  const layout = useMemo(
    () => buildSpiralLayout(projects.length, profile),
    [profile, projects.length],
  );

  const prints = useMemo(
    () =>
      layout.cards.map((card) => {
        const project = projects[card.projectIndex];
        return {
          titleLines: project.titleLines,
          category: project.categoryLabel,
          index: project.id,
          total: projects.length,
        };
      }),
    [layout, projects],
  );

  useEffect(() => {
    let cancelled = false;
    setAtlas(null);

    const tileWidth = profile === "mobile" ? 320 : 384;
    buildCardAtlas(prints, {
      tileWidth,
      tileHeight: Math.round(tileWidth * 1.25),
      columns: 6,
    })
      .then((next) => {
        if (cancelled) {
          next.texture.dispose();
          return;
        }
        setAtlas(next);
      })
      .catch(() => {
        if (!cancelled) onError();
      });

    return () => {
      cancelled = true;
    };
  }, [onError, prints, profile]);

  useEffect(() => {
    if (!atlas) return;
    return () => {
      atlas.texture.dispose();
    };
  }, [atlas]);

  if (!atlas) return null;

  return (
    <Canvas
      frameloop={
        !rest.active ? "never" : rest.reduced ? "demand" : "always"
      }
      dpr={profile === "mobile" ? [1, 1.5] : [1, 1.75]}
      gl={{
        alpha: true,
        antialias: profile === "desktop",
        powerPreference: "high-performance",
        stencil: false,
      }}
      camera={{ fov: profile === "mobile" ? 38 : 33, position: [0, 0, 18] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.setClearAlpha(0);
      }}
      style={{ touchAction: "pan-y", background: "transparent" }}
    >
      <SpiralWorld
        {...rest}
        projects={projects}
        profile={profile}
        onError={onError}
        atlas={atlas}
        layout={layout}
      />
    </Canvas>
  );
}
