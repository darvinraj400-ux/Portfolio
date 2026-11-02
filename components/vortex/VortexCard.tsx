"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { VortexAtlas, UvRect } from "./vortex-texture";
import { reportCardHover } from "@/lib/cursor-signal";
import { VORTEX_CARD } from "@/lib/vortex-config";
import type { VortexBody } from "@/lib/vortex-physics";

export type VortexVisualState = {
  hovered: number | null;
  selected: number | null;
};

type VortexCardProps = {
  body: VortexBody;
  atlas: VortexAtlas;
  sheen: THREE.CanvasTexture;
  visual: RefObject<VortexVisualState>;
  reduced: boolean;
  onSelect: (index: number) => void;
};

function remapUvs(geometry: THREE.BufferGeometry, rect: UvRect) {
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

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function VortexCard({
  body,
  atlas,
  sheen,
  visual,
  reduced,
  onSelect,
}: VortexCardProps) {
  const gl = useThree((state) => state.gl);
  const group = useRef<THREE.Group>(null);
  // Start the visual blend at the restored selection and depth so a resumed
  // scene does not animate its way in from an empty state.
  const selectedAtMount = visual.current.selected;
  const hover = useRef(0);
  const focus = useRef(selectedAtMount === body.index ? 1 : 0);
  const dim = useRef(
    selectedAtMount !== null && selectedAtMount !== body.index ? 1 : 0,
  );
  const depth = useRef(clamp((body.position.z + 3) / 7, 0, 1));

  const resources = useMemo(() => {
    const scale =
      body.halfExtents.x / (VORTEX_CARD.width / 2);
    const width = body.halfExtents.x * 2;
    const height = body.halfExtents.y * 2;
    const cardDepth = body.halfExtents.z * 2;
    const border = VORTEX_CARD.border * scale;
    const radius = Math.min(VORTEX_CARD.radius * scale, cardDepth * 0.4);

    const rimGeometry = new RoundedBoxGeometry(
      width,
      height,
      cardDepth,
      4,
      radius,
    );
    const faceGeometry = new THREE.PlaneGeometry(
      width - border * 2,
      height - border * 2,
    );
    const frontGeometry = faceGeometry.clone();
    remapUvs(frontGeometry, atlas.fronts[body.index]);
    const backGeometry = faceGeometry.clone();
    remapUvs(backGeometry, atlas.backs[body.index]);
    const sheenGeometry = faceGeometry.clone();
    faceGeometry.dispose();

    const rimMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#b9b9bc"),
      metalness: 1,
      roughness: 0.28,
      envMapIntensity: 1.1,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.02,
    });
    const printMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#ffffff"),
      map: atlas.texture,
      metalness: 0.06,
      roughness: 0.58,
      specularIntensity: 0.35,
      clearcoat: 0.22,
      clearcoatRoughness: 0.42,
      envMapIntensity: 0.55,
      emissive: new THREE.Color("#ffffff"),
      emissiveMap: atlas.texture,
      emissiveIntensity: 0.36,
    });
    const sheenMaterial = new THREE.MeshBasicMaterial({
      map: sheen,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    });

    return {
      rimGeometry,
      frontGeometry,
      backGeometry,
      sheenGeometry,
      rimMaterial,
      printMaterial,
      sheenMaterial,
      faceZ: cardDepth / 2 + 0.0012 * scale,
      sheenZ: cardDepth / 2 + 0.0024 * scale,
      width,
      height,
      cardDepth,
    };
  }, [atlas, body, sheen]);

  useEffect(
    () => () => {
      resources.rimGeometry.dispose();
      resources.frontGeometry.dispose();
      resources.backGeometry.dispose();
      resources.sheenGeometry.dispose();
      resources.rimMaterial.dispose();
      resources.printMaterial.dispose();
      resources.sheenMaterial.dispose();
    },
    [resources],
  );

  useEffect(() => {
    if (reduced && group.current) {
      group.current.position.copy(body.position);
      group.current.quaternion.copy(body.orientation);
    }
  }, [body, reduced]);

  useFrame((_, rawDelta) => {
    const card = group.current;
    if (!card) return;

    card.position.copy(body.position);
    card.quaternion.copy(body.orientation);

    const delta = Math.min(rawDelta, 1 / 20);
    const state = visual.current;
    const isHovered =
      state.hovered === body.index && state.selected !== body.index;
    const isSelected = state.selected === body.index;
    const isDimmed = state.selected !== null && !isSelected;

    if (reduced) {
      hover.current = isHovered ? 1 : 0;
      focus.current = isSelected ? 1 : 0;
      dim.current = isDimmed ? 1 : 0;
      depth.current = clamp((body.position.z + 3) / 7, 0, 1);
    } else {
      hover.current = THREE.MathUtils.damp(
        hover.current,
        isHovered ? 1 : 0,
        8,
        delta,
      );
      focus.current = THREE.MathUtils.damp(
        focus.current,
        isSelected ? 1 : 0,
        5,
        delta,
      );
      dim.current = THREE.MathUtils.damp(
        dim.current,
        isDimmed ? 1 : 0,
        4.5,
        delta,
      );
      depth.current = THREE.MathUtils.damp(
        depth.current,
        clamp((body.position.z + 3) / 7, 0, 1),
        2.4,
        delta,
      );
    }

    const near = 0.6 + depth.current * 0.4;
    const rim = resources.rimMaterial;
    rim.emissiveIntensity = Math.max(
      0.012,
      0.02 + hover.current * 0.16 + focus.current * 0.34 - dim.current * 0.01,
    );
    rim.color.setScalar(
      clamp(near * (1 - dim.current * 0.45) + hover.current * 0.04, 0.18, 0.82),
    );

    const print = resources.printMaterial;
    print.emissiveIntensity = Math.max(
      0.1,
      0.34 + hover.current * 0.12 + focus.current * 0.26 - dim.current * 0.08,
    );
    print.color.setScalar(
      clamp(near * (1 - dim.current * 0.52), 0.28, 1),
    );

    resources.sheenMaterial.opacity =
      (0.14 + hover.current * 0.06 + focus.current * 0.08) *
      (0.55 + depth.current * 0.45) *
      (1 - dim.current * 0.45);
  });

  const setHover = (hovered: boolean) => {
    const state = visual.current;
    state.hovered = hovered ? body.index : null;
    gl.domElement.dataset.hover = hovered ? "true" : "false";
    reportCardHover(hovered);
  };

  return (
    <group
      ref={group}
      position={[body.position.x, body.position.y, body.position.z]}
      quaternion={[
        body.orientation.x,
        body.orientation.y,
        body.orientation.z,
        body.orientation.w,
      ]}
    >
      <mesh
        geometry={resources.rimGeometry}
        material={resources.rimMaterial}
        onPointerOver={(event) => {
          if (event.nativeEvent.pointerType !== "mouse") return;
          event.stopPropagation();
          setHover(true);
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          if (visual.current.hovered === body.index) setHover(false);
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (event.delta > 6) return;
          onSelect(body.index);
        }}
      />
      <mesh
        geometry={resources.frontGeometry}
        material={resources.printMaterial}
        position={[0, 0, resources.faceZ]}
        raycast={() => {}}
      />
      <mesh
        geometry={resources.backGeometry}
        material={resources.printMaterial}
        position={[0, 0, -resources.faceZ]}
        rotation={[0, Math.PI, 0]}
        raycast={() => {}}
      />
      <mesh
        geometry={resources.sheenGeometry}
        material={resources.sheenMaterial}
        position={[0, 0, resources.sheenZ]}
        renderOrder={3}
        raycast={() => {}}
      />
      <mesh
        geometry={resources.sheenGeometry}
        material={resources.sheenMaterial}
        position={[0, 0, -resources.sheenZ]}
        rotation={[0, Math.PI, 0]}
        renderOrder={3}
        raycast={() => {}}
      />
    </group>
  );
}
