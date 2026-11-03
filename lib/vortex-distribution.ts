import { Euler, Quaternion, Vector3 } from "three";
import {
  CARD_PROFILES,
  CARD_REGIONS,
  VORTEX_CARD,
  VORTEX_SEED,
  type VortexEnvironment,
} from "./vortex-config";
import { heightFraction, sampleAir, vortexRadiusAt } from "./vortex-forces";
import type { VortexProject } from "./vortex-types";

export type SeededBody = {
  position: Vector3;
  quaternion: Quaternion;
  velocity: Vector3;
  angularVelocity: Vector3;
};

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const AXIS_BIAS = [
  [0.9, 0.32, 0.18],
  [0.22, 0.95, -0.38],
  [-0.44, 0.26, 0.92],
  [0.62, -0.58, 0.48],
  [0.18, 0.74, -0.66],
] as const;

/**
 * Deterministic, asymmetric five-body seeding. Heights, radii, angles and
 * depths are deliberately irregular rather than points on a helix.
 */
export function buildInitialBodies(
  projects: VortexProject[],
  env: VortexEnvironment,
): SeededBody[] {
  if (env.population === 5 && projects.length <= 5) {
    return buildFiveInitialBodies(projects, env);
  }
  return buildFullInitialBodies(projects, env);
}

function buildFiveInitialBodies(
  projects: VortexProject[],
  env: VortexEnvironment,
): SeededBody[] {
  const bodies: SeededBody[] = [];
  const volumeHeight = env.volume.top - env.volume.bottom;

  projects.forEach((_, index) => {
    const random = mulberry32(VORTEX_SEED + index * 1013 + 0x9e37);
    const region = CARD_REGIONS[index % CARD_REGIONS.length];

    const height =
      region.height + (random() - 0.5) * 0.06;
    const y = env.volume.bottom + height * volumeHeight;
    const radius = vortexRadiusAt(env.volume, y) * region.radius * (0.94 + random() * 0.12);
    const angle = region.angle + (random() - 0.5) * 0.22;
    const position = new Vector3(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius,
    );

    const quaternion = new Quaternion().setFromEuler(
      new Euler(
        (random() - 0.5) * 0.52,
        (random() - 0.5) * 0.95,
        (random() - 0.5) * 0.4,
        "YXZ",
      ),
    );

    const velocity = new Vector3();
    sampleAir(env, velocity, position.x, position.y, position.z, 0, 1, 1, null);
    velocity.multiplyScalar(0.48 + random() * 0.18);
    velocity.x += (random() - 0.5) * 0.18;
    velocity.y += (random() - 0.5) * 0.14;
    velocity.z += (random() - 0.5) * 0.18;

    const axis = new Vector3(...AXIS_BIAS[index % AXIS_BIAS.length]);
    axis.x += (random() - 0.5) * 0.5;
    axis.y += (random() - 0.5) * 0.5;
    axis.z += (random() - 0.5) * 0.5;
    axis.normalize();
    const spinScale = env.id === "mobile" ? 0.62 : 1;
    const angularVelocity = axis.multiplyScalar(
      (0.32 + random() * 0.92) * spinScale,
    );

    bodies.push({ position, quaternion, velocity, angularVelocity });
  });

  return bodies;
}

type InitialRegion = "lower" | "middle" | "upper";

const FULL_REGION_BOUNDS: Record<
  InitialRegion,
  { start: number; end: number; radiusMin: number; radiusMax: number }
> = {
  lower: { start: 0.035, end: 0.315, radiusMin: 0.52, radiusMax: 0.93 },
  middle: { start: 0.36, end: 0.64, radiusMin: 0.44, radiusMax: 0.88 },
  upper: { start: 0.68, end: 0.94, radiusMin: 0.34, radiusMax: 0.82 },
};

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function shuffle<T>(values: T[], random: () => number) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [values[index], values[swap]] = [values[swap], values[index]];
  }
  return values;
}

function axesOf(quaternion: Quaternion) {
  return [
    new Vector3(1, 0, 0).applyQuaternion(quaternion),
    new Vector3(0, 1, 0).applyQuaternion(quaternion),
    new Vector3(0, 0, 1).applyQuaternion(quaternion),
  ] as const;
}

function orientedExtent(
  axes: readonly Vector3[],
  normal: Vector3,
  half: { x: number; y: number; z: number },
) {
  return (
    Math.abs(normal.dot(axes[0])) * half.x +
    Math.abs(normal.dot(axes[1])) * half.y +
    Math.abs(normal.dot(axes[2])) * half.z
  );
}

/**
 * Initial 33-body seeding: exact 11 / 13 / 9 regional split, stratified but
 * jittered heights, irregular radii and angles, and a short deterministic
 * relaxation pass so no card starts intersecting another.
 */
function buildFullInitialBodies(
  projects: VortexProject[],
  env: VortexEnvironment,
): SeededBody[] {
  const count = projects.length;
  const volumeHeight = env.volume.top - env.volume.bottom;
  const random = mulberry32(VORTEX_SEED ^ 0xc0ffee ^ count);
  const labels: InitialRegion[] = [];
  const lowerCount = Math.round((count * 11) / 33);
  const middleCount = Math.round((count * 13) / 33);
  for (let index = 0; index < lowerCount; index += 1) labels.push("lower");
  for (let index = 0; index < middleCount; index += 1) labels.push("middle");
  while (labels.length < count) labels.push("upper");
  shuffle(labels, random);

  const byRegion: Record<InitialRegion, number[]> = {
    lower: [],
    middle: [],
    upper: [],
  };
  labels.forEach((label, index) => byRegion[label].push(index));

  const bands = new Array<InitialRegion>(count);
  for (const region of ["lower", "middle", "upper"] as InitialRegion[]) {
    for (const index of byRegion[region]) bands[index] = region;
  }

  const rankInRegion = new Array<number>(count).fill(0);
  const sizeInRegion = {
    lower: byRegion.lower.length,
    middle: byRegion.middle.length,
    upper: byRegion.upper.length,
  };
  for (const region of ["lower", "middle", "upper"] as InitialRegion[]) {
    byRegion[region].forEach((index, rank) => {
      rankInRegion[index] = rank;
    });
  }

  const seeded: SeededBody[] = [];
  const axes: ReadonlyArray<Vector3>[] = [];
  const half = cardHalfExtents(env).multiplyScalar(0.92);
  const spinScale = env.id === "mobile" ? 0.66 : 1;

  projects.forEach((_, index) => {
    const region = bands[index];
    const bounds = FULL_REGION_BOUNDS[region];
    const localRank =
      (rankInRegion[index] + 0.16 + random() * 0.68) /
      Math.max(sizeInRegion[region], 1);
    const t = bounds.start + localRank * (bounds.end - bounds.start);
    const y = env.volume.bottom + t * volumeHeight;
    const cap = Math.max(vortexRadiusAt(env.volume, y), 0.001);
    const ratio =
      bounds.radiusMin + random() * (bounds.radiusMax - bounds.radiusMin);
    const radius = Math.max(env.volume.innerRadius + 0.12, cap * ratio);
    const angle =
      index * GOLDEN_ANGLE +
      (t - 0.5) * Math.PI * 2 * 1.35 +
      (random() - 0.5) * 1.5;
    const position = new Vector3(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius,
    );

    const quaternion = new Quaternion().setFromEuler(
      new Euler(
        (random() - 0.5) * 0.62,
        (random() - 0.5) * 1.5,
        (random() - 0.5) * 0.56,
        "YXZ",
      ),
    );

    const velocity = new Vector3();
    sampleAir(env, velocity, position.x, position.y, position.z, 0, 1, 1, null);
    velocity.multiplyScalar(0.42 + random() * 0.2);
    velocity.x += (random() - 0.5) * 0.16;
    velocity.y += (random() - 0.5) * 0.12;
    velocity.z += (random() - 0.5) * 0.16;

    const axis = new Vector3(...AXIS_BIAS[index % AXIS_BIAS.length]);
    axis.x += (random() - 0.5) * 0.6;
    axis.y += (random() - 0.5) * 0.6;
    axis.z += (random() - 0.5) * 0.6;
    axis.normalize();
    const angularVelocity = axis.multiplyScalar(
      (0.28 + random() * 0.9) * spinScale,
    );

    seeded.push({ position, quaternion, velocity, angularVelocity });
    axes.push(axesOf(quaternion));
  });

  // Relax initial intersections with oriented support gaps. This runs before
  // the simulation, so it cannot be mistaken for collision resolution.
  const boundary = {
    lower: { start: 0.03, end: 0.322 },
    middle: { start: 0.352, end: 0.648 },
    upper: { start: 0.672, end: 0.95 },
  } satisfies Record<InitialRegion, { start: number; end: number }>;
  const delta = new Vector3();
  const push = new Vector3();

  for (let iteration = 0; iteration < 28; iteration += 1) {
    let moved = false;
    for (let i = 0; i < count; i += 1) {
      for (let j = i + 1; j < count; j += 1) {
        const first = seeded[i];
        const second = seeded[j];
        delta.copy(second.position).sub(first.position);
        const distance = delta.length();
        if (distance > 3.4) continue;
        if (distance < 0.0001) delta.set(1, 0, 0);
        const normal = delta.normalize();
        const gap =
          distance -
          orientedExtent(axes[i], normal, half) -
          orientedExtent(axes[j], normal, half);
        if (gap >= 0.14) continue;

        const correction = Math.min(0.45, (0.14 - gap) * 0.52 + 0.002);
        push.copy(normal).multiplyScalar(correction * 0.5);
        first.position.addScaledVector(push, -1);
        second.position.addScaledVector(push, 1);
        moved = true;

        for (const target of [first, second]) {
          const region = bands[target === first ? i : j];
          const limits = boundary[region];
          const height = heightFraction(env.volume, target.position.y);
          const clamped = Math.min(
            limits.end,
            Math.max(limits.start, height),
          );
          target.position.y = env.volume.bottom + clamped * volumeHeight;
          const cap = Math.max(
            vortexRadiusAt(env.volume, target.position.y),
            0.001,
          );
          const radial = Math.hypot(target.position.x, target.position.z);
          const maxRadius = Math.max(
            env.volume.innerRadius + 0.1,
            cap * 0.93,
          );
          if (radial > maxRadius) {
            target.position.x *= maxRadius / radial;
            target.position.z *= maxRadius / radial;
          }
        }
      }
    }
    if (!moved) break;
  }

  return seeded;
}


export function cardHalfExtents(env: VortexEnvironment) {
  const scale = env.cardScale;
  return new Vector3(
    (VORTEX_CARD.width / 2) * scale,
    (VORTEX_CARD.height / 2) * scale,
    (VORTEX_CARD.depth / 2) * scale,
  );
}

export function cardMass(index: number) {
  return CARD_PROFILES[index % CARD_PROFILES.length].mass;
}
