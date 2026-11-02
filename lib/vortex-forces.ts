import type { VortexEnvironment, VolumeConfig } from "./vortex-config";
import type { VortexInput } from "./vortex-types";
import { addCurlNoise, type Vec3 } from "./vortex-noise";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return amount * amount * (3 - 2 * amount);
};

export function heightFraction(volume: VolumeConfig, y: number) {
  return clamp((y - volume.bottom) / (volume.top - volume.bottom), 0, 1);
}

/**
 * Smooth vertical envelope of the invisible volume: wide and open at the
 * bottom, active through the middle, narrow and concentrated at the top.
 * A little organic waver stops it reading as a machined cone.
 */
export function vortexRadiusAt(volume: VolumeConfig, y: number) {
  const t = heightFraction(volume, y);
  const middle = volume.midBias;
  const base =
    t <= middle
      ? volume.radiusBottom +
        (volume.radiusMiddle - volume.radiusBottom) *
          smoothstep(0, 1, t / middle)
      : volume.radiusMiddle +
        (volume.radiusTop - volume.radiusMiddle) *
          smoothstep(0, 1, (t - middle) / (1 - middle));
  const organic =
    1 +
    volume.organic *
      (0.55 * Math.sin(t * 7.9 + 0.6) +
        0.3 * Math.sin(t * 13.4 + 2.2) +
        0.15 * Math.sin(t * 21.7 + 4));
  return base * organic;
}

function addBaseWind(
  env: VortexEnvironment,
  out: Vec3,
  x: number,
  y: number,
  z: number,
  time: number,
  windLevel: number,
  spinDirection: number,
) {
  const t = heightFraction(env.volume, y);
  const radial = Math.hypot(x, z);
  const cap = Math.max(vortexRadiusAt(env.volume, y), 0.001);
  const radialNorm = radial / cap;
  const dirX = radial > 0.0001 ? x / radial : 0;
  const dirZ = radial > 0.0001 ? z / radial : 0;

  const gust =
    1 +
    env.wind.gustAmplitude *
      (0.55 * Math.sin(time * env.wind.gustRate + 0.8) +
        0.3 * Math.sin(time * env.wind.gustRate * 2.7 + 2.1) +
        0.15 * Math.sin(time * env.wind.gustRate * 6.1 + 4.4));

  // Rankine-like core: rotation rises from the eye and settles at the rim.
  const swirl = 0.12 + 0.88 * smoothstep(0.04, 0.48, radialNorm);
  const heightProfile = 0.62 + 0.5 * Math.pow(Math.sin(Math.PI * t), 1.2);
  const tangential =
    env.wind.tangential *
    windLevel *
    spinDirection *
    heightProfile *
    swirl *
    gust;

  out.x += -dirZ * tangential;
  out.z += dirX * tangential;

  // Updraft belongs to the whole lower chamber, not only the eye, so cards
  // no longer herd toward the centre line as they rise.
  const core = Math.exp(-radialNorm * radialNorm * 2.2);
  const updraft = (0.42 + 0.38 * core) * (1 - smoothstep(0.52, 0.9, t) * 0.97);
  const downdraft =
    0.68 * smoothstep(0.58, 0.92, t) +
    0.3 * Math.min(1.4, radialNorm * radialNorm) * smoothstep(0.18, 0.8, t);
  // A dense 33-body field settles below its own middle if the upper
  // downdraft runs at full strength; soften it so the tall chamber keeps
  // circulating rather than draining into the lower third.
  const updraftGain = env.population === 33 ? 0.94 : 0.8;
  const downdraftGain = env.population === 33 ? 0.34 : 1;
  const lift =
    env.wind.vertical *
    windLevel *
    (updraftGain * updraft - downdraftGain * downdraft) *
    (0.8 +
      0.2 *
        Math.sin(time * 0.23 + t * 4.2 + Math.sin(radialNorm * 2.1)));
  const azimuth = Math.atan2(z, x);
  const variation =
    env.wind.verticalVariation *
    windLevel *
    (0.62 * Math.sin(azimuth * 1.7 + time * 0.24 + t * 3.3) +
      0.38 * Math.sin(azimuth * 3.1 - time * 0.15 + 1.7));
  const recirculation =
    env.wind.vertical *
    windLevel *
    0.14 *
    Math.sin(t * Math.PI * 2 + time * 0.17 + 0.9);
  out.y += lift + variation + recirculation;

  const inflowEnvelope = (1 - smoothstep(0.2, 0.75, t)) * 0.42;
  const outflowEnvelope = smoothstep(0.62, 0.95, t) * 0.5;
  const centreGuard =
    1 -
    smoothstep(
      env.volume.innerRadius * 1.05,
      env.volume.innerRadius * 2.4,
      radial,
    );
  const radialDrift =
    env.wind.radial *
    windLevel *
    (outflowEnvelope - inflowEnvelope + centreGuard * 0.55) *
    (0.7 + 0.3 * Math.sin(time * 0.27 + t * 5 + 1.1));
  out.x += dirX * radialDrift;
  out.z += dirZ * radialDrift;
}

export function addTurbulenceWind(
  env: VortexEnvironment,
  out: Vec3,
  x: number,
  y: number,
  z: number,
  time: number,
  windLevel: number,
) {
  const t = heightFraction(env.volume, y);
  const profile = 0.72 + 0.28 * Math.sin(Math.PI * t);
  const strength = env.turbulence.strength * windLevel * profile;
  const frequency = env.turbulence.scale;
  const drift = env.turbulence.timeScale;

  addCurlNoise(out, x, y, z, time, frequency, strength * 0.62, drift);
  addCurlNoise(
    out,
    x,
    y,
    z,
    time,
    frequency * 2.8,
    strength * 0.27,
    drift * 1.7,
  );
  if (env.turbulence.octaves >= 3) {
    addCurlNoise(
      out,
      x,
      y,
      z,
      time,
      frequency * 7.1,
      strength * 0.1,
      drift * 3.2,
    );
  }
}

/**
 * A restrained local disturbance under the pointer. It perturbs the air
 * field, never a card transform.
 */
export function addPointerWind(
  env: VortexEnvironment,
  out: Vec3,
  x: number,
  y: number,
  z: number,
  input: VortexInput,
) {
  if (!input.pointerActive) return;

  const pointerX = input.pointerX * env.pointer.xHalfExtent;
  const pointerY = env.pointer.yCenter - input.pointerY * env.pointer.yHalfExtent;
  const dx = x - pointerX;
  const dy = y - pointerY;
  const dz = z - env.pointer.z;
  const distanceSquared = dx * dx + dy * dy + dz * dz;
  const falloff = Math.exp(
    -distanceSquared / (env.pointer.radius * env.pointer.radius),
  );
  if (falloff < 0.002) return;

  const horizontal = Math.hypot(dx, dz) + 0.0001;
  const swirlX = -dz / horizontal;
  const swirlZ = dx / horizontal;
  out.x += (swirlX * env.pointer.swirl - (dx / horizontal) * 0.12) * falloff;
  out.z += (swirlZ * env.pointer.swirl - (dz / horizontal) * 0.12) * falloff;
  out.y += env.pointer.lift * falloff;
}

export function sampleAir(
  env: VortexEnvironment,
  out: Vec3,
  x: number,
  y: number,
  z: number,
  time: number,
  windLevel: number,
  spinDirection: number,
  input: VortexInput | null,
) {
  out.x = 0;
  out.y = 0;
  out.z = 0;
  addBaseWind(env, out, x, y, z, time, windLevel, spinDirection);
  addTurbulenceWind(env, out, x, y, z, time, windLevel);
  if (input) addPointerWind(env, out, x, y, z, input);
}
