export type Vec3 = { x: number; y: number; z: number };

const PERMUTATION = new Uint8Array(512);
const GRADIENTS = [
  [1, 1, 0],
  [-1, 1, 0],
  [1, -1, 0],
  [-1, -1, 0],
  [1, 0, 1],
  [-1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
  [0, 1, 1],
  [0, -1, 1],
  [0, 1, -1],
  [0, -1, -1],
] as const;

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function initialise(seed: number) {
  const random = mulberry32(seed);
  const values = Array.from({ length: 256 }, (_, index) => index);
  for (let index = 255; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const value = values[index];
    values[index] = values[swap];
    values[swap] = value;
  }
  for (let index = 0; index < 512; index += 1) {
    PERMUTATION[index] = values[index & 255];
  }
}

initialise(0x2f6e2b1);

function fade(value: number) {
  return value * value * value * (value * (value * 6 - 15) + 10);
}

function lerp(a: number, b: number, amount: number) {
  return a + (b - a) * amount;
}

function gradient(hash: number, x: number, y: number, z: number) {
  const gradient = GRADIENTS[hash % 12];
  return gradient[0] * x + gradient[1] * y + gradient[2] * z;
}

/** Classic improved Perlin noise in roughly [-1, 1]. Allocation-free. */
export function noise3(x: number, y: number, z: number): number {
  const floorX = Math.floor(x);
  const floorY = Math.floor(y);
  const floorZ = Math.floor(z);
  const cellX = floorX & 255;
  const cellY = floorY & 255;
  const cellZ = floorZ & 255;
  const localX = x - floorX;
  const localY = y - floorY;
  const localZ = z - floorZ;
  const u = fade(localX);
  const v = fade(localY);
  const w = fade(localZ);

  const a = PERMUTATION[cellX] + cellY;
  const aa = PERMUTATION[a] + cellZ;
  const ab = PERMUTATION[a + 1] + cellZ;
  const b = PERMUTATION[cellX + 1] + cellY;
  const ba = PERMUTATION[b] + cellZ;
  const bb = PERMUTATION[b + 1] + cellZ;

  return lerp(
    lerp(
      lerp(
        gradient(PERMUTATION[aa], localX, localY, localZ),
        gradient(PERMUTATION[ba], localX - 1, localY, localZ),
        u,
      ),
      lerp(
        gradient(PERMUTATION[ab], localX, localY - 1, localZ),
        gradient(PERMUTATION[bb], localX - 1, localY - 1, localZ),
        u,
      ),
      v,
    ),
    lerp(
      lerp(
        gradient(PERMUTATION[aa + 1], localX, localY, localZ - 1),
        gradient(PERMUTATION[ba + 1], localX - 1, localY, localZ - 1),
        u,
      ),
      lerp(
        gradient(PERMUTATION[ab + 1], localX, localY - 1, localZ - 1),
        gradient(PERMUTATION[bb + 1], localX - 1, localY - 1, localZ - 1),
        u,
      ),
      v,
    ),
    w,
  );
}

const OFFSETS = [13.7, 4.1, 7.9] as const;

function potential(
  x: number,
  y: number,
  z: number,
  component: 0 | 1 | 2,
): number {
  const offset = OFFSETS[component];
  return noise3(x + offset, y + offset * 0.63, z - offset * 0.41);
}

/**
 * Divergence-free turbulence. A three-component noise potential is sampled
 * and differentiated into a curl, so the field folds into eddies instead of
 * pushing everything outward. Coordinates are pre-scaled by the caller.
 */
export function addCurlNoise(
  out: Vec3,
  x: number,
  y: number,
  z: number,
  time: number,
  frequency: number,
  amplitude: number,
  timeDrift: number,
): void {
  const px = x * frequency + time * timeDrift;
  const py = y * frequency * 0.82 + time * timeDrift * 0.61;
  const pz = z * frequency + time * timeDrift * 0.77;
  const epsilon = 0.32;

  const dy0 =
    (potential(px, py + epsilon, pz, 0) -
      potential(px, py - epsilon, pz, 0)) /
    (2 * epsilon);
  const dz0 =
    (potential(px, py, pz + epsilon, 0) -
      potential(px, py, pz - epsilon, 0)) /
    (2 * epsilon);
  const dx1 =
    (potential(px + epsilon, py, pz, 1) -
      potential(px - epsilon, py, pz, 1)) /
    (2 * epsilon);
  const dz1 =
    (potential(px, py, pz + epsilon, 1) -
      potential(px, py, pz - epsilon, 1)) /
    (2 * epsilon);
  const dx2 =
    (potential(px + epsilon, py, pz, 2) -
      potential(px - epsilon, py, pz, 2)) /
    (2 * epsilon);
  const dy2 =
    (potential(px, py + epsilon, pz, 2) -
      potential(px, py - epsilon, pz, 2)) /
    (2 * epsilon);

  out.x += (dy2 - dz1) * amplitude;
  out.y += (dz0 - dx2) * amplitude;
  out.z += (dx1 - dy0) * amplitude;
}
