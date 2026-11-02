import { PROJECTS } from "./projects";
import { splitTitle } from "./spiral";
import type { Vec3Tuple, VortexProject } from "./vortex-types";

export const VORTEX_SEED = 0x5eed1d;

/**
 * Five real projects from the portfolio inventory. Nothing is invented and
 * the 33-project collection itself is untouched.
 */
export const VORTEX_PROJECTS: VortexProject[] = [
  {
    index: "01",
    slug: "pastel-aesthetic-theme",
    name: "Pastel Aesthetic Theme",
    titleLines: ["Pastel Aesthetic", "Theme"],
    category: "Website design",
  },
  {
    index: "09",
    slug: "aether-cosmos",
    name: "Aether Cosmos",
    titleLines: ["Aether Cosmos"],
    category: "Website design",
  },
  {
    index: "27",
    slug: "pocketpal",
    name: "PocketPal",
    titleLines: ["PocketPal"],
    category: "Mobile design",
  },
  {
    index: "28",
    slug: "docuflow-ai",
    name: "DocuFlow AI",
    titleLines: ["DocuFlow AI"],
    category: "AI & automation",
  },
  {
    index: "32",
    slug: "stockpilot",
    name: "StockPilot",
    titleLines: ["StockPilot"],
    category: "Business systems",
  },
];

const VORTEX_CATEGORY_LABEL: Record<string, string> = {
  website: "Website design",
  mobile: "Mobile design",
  ai: "AI & automation",
  business: "Business systems",
};

/**
 * The full 33-project inventory, derived directly from lib/projects.ts so
 * there is no second source of truth. One record becomes one physical card;
 * aliases stay on the record and never create extra cards.
 */
export const FULL_VORTEX_PROJECTS: VortexProject[] = PROJECTS.map((project) => ({
  index: project.id,
  slug: project.slug,
  name: project.name,
  titleLines: splitTitle(project.name),
  category: VORTEX_CATEGORY_LABEL[project.category] ?? project.category,
  shortDescription: project.shortDescription,
}));

export const VORTEX_POPULATIONS = [5, 33] as const;
export type VortexPopulation = (typeof VORTEX_POPULATIONS)[number];

export type CardProfile = {
  mass: number;
  drag: number;
  angularDrag: number;
  windResponse: number;
  torqueResponse: number;
  inertia: number;
};

/**
 * Physical personalities, not animation presets: mass, drag, angular drag,
 * susceptibility to moving air and rotational inertia.
 */
export const CARD_PROFILES: CardProfile[] = [
  {
    mass: 2.15,
    drag: 0.78,
    angularDrag: 0.52,
    windResponse: 0.82,
    torqueResponse: 0.86,
    inertia: 1.12,
  },
  {
    mass: 1.05,
    drag: 1.05,
    angularDrag: 0.34,
    windResponse: 1.12,
    torqueResponse: 1.18,
    inertia: 0.82,
  },
  {
    mass: 1.35,
    drag: 0.94,
    angularDrag: 0.42,
    windResponse: 1.02,
    torqueResponse: 1.02,
    inertia: 0.95,
  },
  {
    mass: 0.98,
    drag: 1.02,
    angularDrag: 0.3,
    windResponse: 1.1,
    torqueResponse: 1.16,
    inertia: 0.84,
  },
  {
    mass: 1.7,
    drag: 0.86,
    angularDrag: 0.4,
    windResponse: 0.9,
    torqueResponse: 0.94,
    inertia: 1.02,
  },
];

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Subtle physical variation keyed to the canonical project identity, not to
 * its slot in an animation. The five-card study keeps its authored profiles.
 */
export function buildFullCardProfile(
  project: VortexProject,
  index: number,
): CardProfile {
  const random = seededRandom(
    hashString(project.slug) ^ Math.imul(index + 1, 0x9e3779b9),
  );
  return {
    mass: 0.98 + random() * 1.18,
    drag: 0.78 + random() * 0.32,
    angularDrag: 0.3 + random() * 0.24,
    windResponse: 0.82 + random() * 0.3,
    torqueResponse: 0.86 + random() * 0.32,
    inertia: 0.82 + random() * 0.32,
  };
}

/** Landscape physical card, unscaled. */
export const VORTEX_CARD = {
  width: 2.5,
  height: 1.77,
  depth: 0.092,
  border: 0.038,
  radius: 0.055,
  segments: 4,
} as const;

export type VolumeConfig = {
  bottom: number;
  top: number;
  radiusBottom: number;
  radiusMiddle: number;
  radiusTop: number;
  midBias: number;
  organic: number;
  innerRadius: number;
  outerStart: number;
  outerAllowance: number;
  verticalInset: number;
};

export type WindConfig = {
  tangential: number;
  vertical: number;
  verticalVariation: number;
  radial: number;
  gustAmplitude: number;
  gustRate: number;
  boostPerEnergy: number;
  maxEnergy: number;
  energyDecay: number;
  levelRate: number;
  levelRelaxRate: number;
  directionRate: number;
  /** Wind energy normalised per pixel of page scroll. */
  scrollGain: number;
  /** Maximum energy admitted from one animation frame of scrolling. */
  scrollImpulseMax: number;
};

export type TurbulenceConfig = {
  strength: number;
  scale: number;
  octaves: number;
  timeScale: number;
  torque: number;
  torqueScale: number;
};

export type ContainmentConfig = {
  outerStart: number;
  outerStiffness: number;
  outerDamping: number;
  outerMaxAccel: number;
  innerStiffness: number;
  verticalStiffness: number;
  verticalMaxAccel: number;
  /** Fraction of the centripetal force implied by the card's own swirl. */
  orbitalSupport: number;
};

export type SeparationConfig = {
  /** Preferred empty surface gap between oriented card bodies. */
  gap: number;
  /** Soft range over which density spacing fades in. */
  range: number;
  stiffness: number;
  damping: number;
  maxAccel: number;
  /** Radius of the local occupancy pressure. */
  neighborhoodRadius: number;
  pressure: number;
  pressureMaxAccel: number;
  /** Crowding (summed neighbour weights) below which no pressure is applied. */
  pressureStart: number;
  /** Preferred separation in radial-ratio units for cards at similar height. */
  radialSpacing: number;
  /** Soft fade distance beyond the radial spacing. */
  radialRange: number;
  radialPressure: number;
  /** Height band over which radial occupancy is compared. */
  radialHeightBand: number;
};

export type CollisionConfig = {
  friction: number;
  restitution: number;
  solverIterations: number;
  internalPgsIterations: number;
  ccdSubsteps: number;
  contactSkin: number;
  /** Penetration the solver is allowed to leave, in metres. */
  allowedLinearError: number;
  /** Conservative invisible padding around the rendered card. */
  padding: number;
};

export type SelectionConfig = {
  target: Vec3Tuple;
  spring: number;
  damping: number;
  maxAccel: number;
  angularSpring: number;
  angularDamping: number;
  windScale: number;
  turbulenceScale: number;
  dragScale: number;
  angularDragScale: number;
  targetWobble: number;
  blendRate: number;
  /** Centre distance where the selection spring starts yielding to neighbours. */
  proximityRange: number;
  /** Selection force multiplier at the closest proximity. */
  proximityScale: number;
  /** How much the surrounding field parts around a pulled card. 0 keeps the five-card field untouched. */
  fieldYield: number;
  /** Radius of the pressure wave pushed ahead of a pulled card. */
  wakeRange: number;
  wakeAccel: number;
  yaw: number;
  pitch: number;
  roll: number;
};

export type PointerConfig = {
  xHalfExtent: number;
  yHalfExtent: number;
  yCenter: number;
  z: number;
  radius: number;
  swirl: number;
  lift: number;
};

export type AerodynamicsConfig = {
  gain: number;
  linearDamping: number;
};

export type PhysicsConfig = {
  fixedStep: number;
  maxSubsteps: number;
  maxFrameDelta: number;
  maxSpeed: number;
  maxAngularSpeed: number;
  maxAcceleration: number;
};

export type CameraConfig = {
  fov: number;
  position: Vec3Tuple;
  target: Vec3Tuple;
  near: number;
  far: number;
  dpr: [number, number];
};

export type AtlasConfig = {
  /** Width of one front/back tile in the shared card atlas. */
  tileWidth: number;
  /** Tiles per atlas row. Keeps a 33-card atlas inside common GPU limits. */
  columns: number;
};

export type VortexEnvironment = {
  id: "desktop" | "mobile";
  population: VortexPopulation;
  cardScale: number;
  volume: VolumeConfig;
  wind: WindConfig;
  turbulence: TurbulenceConfig;
  containment: ContainmentConfig;
  separation: SeparationConfig;
  collision: CollisionConfig;
  selection: SelectionConfig;
  pointer: PointerConfig;
  aerodynamics: AerodynamicsConfig;
  physics: PhysicsConfig;
  camera: CameraConfig;
  atlas: AtlasConfig;
};

export type CardRegion = {
  /** 0 at the open bottom, 1 at the concentrated top. */
  height: number;
  /** Fraction of the local volume radius. */
  radius: number;
  angle: number;
};

/**
 * Irregular, asymmetric seeded regions: lower open band, dense working
 * middle, concentrated top. Seed jitter keeps it from reading as a helix.
 */
export const CARD_REGIONS: CardRegion[] = [
  { height: 0.2, radius: 0.82, angle: 0.5 },
  { height: 0.58, radius: 0.58, angle: 3.9 },
  { height: 0.44, radius: 0.72, angle: 5.65 },
  { height: 0.31, radius: 0.88, angle: 2.3 },
  { height: 0.78, radius: 0.6, angle: 1.15 },
];

const DESKTOP: VortexEnvironment = {
  id: "desktop",
  population: 5,
  cardScale: 1,
  volume: {
    bottom: -5.4,
    top: 6.2,
    radiusBottom: 4.35,
    radiusMiddle: 3.05,
    radiusTop: 1.75,
    midBias: 0.5,
    organic: 0.055,
    innerRadius: 1.15,
    outerStart: 0.94,
    outerAllowance: 1.18,
    verticalInset: 0.24,
  },
  wind: {
    tangential: 1.6,
    vertical: 0.52,
    verticalVariation: 0.32,
    radial: 0.26,
    gustAmplitude: 0.26,
    gustRate: 0.21,
    boostPerEnergy: 1.05,
    maxEnergy: 1.8,
    energyDecay: 1.15,
    levelRate: 1.8,
    levelRelaxRate: 1.8,
    directionRate: 1.5,
    scrollGain: 0.0015,
    scrollImpulseMax: 1.8,
  },
  turbulence: {
    strength: 0.95,
    scale: 0.42,
    octaves: 3,
    timeScale: 0.16,
    torque: 1.0,
    torqueScale: 0.68,
  },
  containment: {
    outerStart: 0.94,
    outerStiffness: 8.5,
    outerDamping: 1.6,
    outerMaxAccel: 18,
    innerStiffness: 28,
    verticalStiffness: 9,
    verticalMaxAccel: 20,
    orbitalSupport: 1,
  },
  separation: {
    gap: 0.1,
    range: 0.32,
    stiffness: 4.8,
    damping: 1.15,
    maxAccel: 2.8,
    neighborhoodRadius: 4.8,
    pressure: 1.5,
    pressureMaxAccel: 2.1,
    pressureStart: 0.55,
    radialSpacing: 0.18,
    radialRange: 0.12,
    radialPressure: 0.62,
    radialHeightBand: 0.34,
  },
  collision: {
    friction: 0.52,
    restitution: 0.045,
    solverIterations: 12,
    internalPgsIterations: 4,
    ccdSubsteps: 8,
    contactSkin: 0.002,
    allowedLinearError: 0.0002,
    padding: 0.006,
  },
  selection: {
    target: [0, 0.12, 9.2],
    spring: 22,
    damping: 9.2,
    maxAccel: 26,
    angularSpring: 12,
    angularDamping: 5.5,
    windScale: 0.42,
    turbulenceScale: 0.16,
    dragScale: 2.4,
    angularDragScale: 3,
    targetWobble: 0.065,
    blendRate: 1.5,
    proximityRange: 2.9,
    proximityScale: 0.18,
    fieldYield: 0,
    wakeRange: 0,
    wakeAccel: 0,
    yaw: 0.05,
    pitch: -0.03,
    roll: 0.015,
  },
  pointer: {
    xHalfExtent: 5.2,
    yHalfExtent: 3.4,
    yCenter: 0.2,
    z: 3,
    radius: 2.4,
    swirl: 0.5,
    lift: 0.1,
  },
  aerodynamics: {
    gain: 0.27,
    linearDamping: 0.015,
  },
  physics: {
    fixedStep: 1 / 120,
    maxSubsteps: 5,
    maxFrameDelta: 0.05,
    maxSpeed: 7.5,
    maxAngularSpeed: 7,
    maxAcceleration: 30,
  },
  camera: {
    fov: 33,
    position: [0, 0.25, 15.9],
    target: [0, 0.2, 0],
    near: 0.1,
    far: 60,
    dpr: [1, 1.75],
  },
  atlas: {
    tileWidth: 720,
    columns: 5,
  },
};

const MOBILE: VortexEnvironment = {
  id: "mobile",
  population: 5,
  cardScale: 0.78,
  volume: {
    bottom: -4.4,
    top: 5.0,
    radiusBottom: 2.25,
    radiusMiddle: 1.82,
    radiusTop: 1.15,
    midBias: 0.5,
    organic: 0.05,
    innerRadius: 0.55,
    outerStart: 0.94,
    outerAllowance: 1.16,
    verticalInset: 0.2,
  },
  wind: {
    tangential: 1.24,
    vertical: 0.44,
    verticalVariation: 0.24,
    radial: 0.2,
    gustAmplitude: 0.22,
    gustRate: 0.19,
    boostPerEnergy: 0.9,
    maxEnergy: 1.6,
    energyDecay: 1.15,
    levelRate: 1.8,
    levelRelaxRate: 1.8,
    directionRate: 1.4,
    scrollGain: 0.0015,
    scrollImpulseMax: 1.8,
  },
  turbulence: {
    strength: 0.6,
    scale: 0.34,
    octaves: 2,
    timeScale: 0.14,
    torque: 0.68,
    torqueScale: 0.62,
  },
  containment: {
    outerStart: 0.92,
    outerStiffness: 9,
    outerDamping: 1.6,
    outerMaxAccel: 16,
    innerStiffness: 30,
    verticalStiffness: 10,
    verticalMaxAccel: 18,
    orbitalSupport: 0.9,
  },
  separation: {
    gap: 0.08,
    range: 0.28,
    stiffness: 5,
    damping: 1.2,
    maxAccel: 2.6,
    neighborhoodRadius: 4,
    pressure: 1.6,
    pressureMaxAccel: 2.2,
    pressureStart: 0.55,
    radialSpacing: 0.16,
    radialRange: 0.1,
    radialPressure: 0.66,
    radialHeightBand: 0.32,
  },
  collision: {
    friction: 0.5,
    restitution: 0.05,
    solverIterations: 12,
    internalPgsIterations: 4,
    ccdSubsteps: 8,
    contactSkin: 0.002,
    allowedLinearError: 0.0002,
    padding: 0.006,
  },
  selection: {
    target: [0, 0.08, 6.9],
    spring: 24,
    damping: 9.6,
    maxAccel: 24,
    angularSpring: 12,
    angularDamping: 5.5,
    windScale: 0.4,
    turbulenceScale: 0.14,
    dragScale: 2.4,
    angularDragScale: 3,
    targetWobble: 0.045,
    blendRate: 1.5,
    proximityRange: 2.4,
    proximityScale: 0.18,
    fieldYield: 0,
    wakeRange: 0,
    wakeAccel: 0,
    yaw: 0.04,
    pitch: -0.02,
    roll: 0.01,
  },
  pointer: {
    xHalfExtent: 2.4,
    yHalfExtent: 3.8,
    yCenter: 0.1,
    z: 2.4,
    radius: 1.9,
    swirl: 0.3,
    lift: 0.06,
  },
  aerodynamics: {
    gain: 0.3,
    linearDamping: 0.02,
  },
  physics: {
    fixedStep: 1 / 90,
    maxSubsteps: 4,
    maxFrameDelta: 0.05,
    maxSpeed: 6,
    maxAngularSpeed: 6,
    maxAcceleration: 26,
  },
  camera: {
    fov: 44,
    position: [0, 0.1, 14.8],
    target: [0, 0.08, 0],
    near: 0.1,
    far: 50,
    dpr: [1, 1.5],
  },
  atlas: {
    tileWidth: 448,
    columns: 5,
  },
};

const FULL_DESKTOP: VortexEnvironment = {
  id: "desktop",
  population: 33,
  cardScale: 1,
  volume: {
    bottom: -6.2,
    top: 8.0,
    radiusBottom: 5.0,
    radiusMiddle: 3.7,
    radiusTop: 2.35,
    midBias: 0.5,
    organic: 0.06,
    innerRadius: 1.05,
    outerStart: 0.94,
    outerAllowance: 1.18,
    verticalInset: 0.26,
  },
  wind: {
    tangential: 1.68,
    vertical: 0.54,
    verticalVariation: 0.32,
    radial: 0.28,
    gustAmplitude: 0.26,
    gustRate: 0.21,
    boostPerEnergy: 1.05,
    maxEnergy: 1.8,
    energyDecay: 1.15,
    levelRate: 3.6,
    levelRelaxRate: 1.7,
    directionRate: 2.4,
    scrollGain: 0.0025,
    scrollImpulseMax: 1.8,
  },
  turbulence: {
    strength: 0.92,
    scale: 0.38,
    octaves: 3,
    timeScale: 0.16,
    torque: 1.0,
    torqueScale: 0.68,
  },
  containment: {
    outerStart: 0.94,
    outerStiffness: 8.5,
    outerDamping: 1.6,
    outerMaxAccel: 18,
    innerStiffness: 28,
    verticalStiffness: 8.5,
    verticalMaxAccel: 19,
    orbitalSupport: 1,
  },
  separation: {
    gap: 0.12,
    range: 0.42,
    stiffness: 4.4,
    damping: 1.15,
    maxAccel: 2.6,
    neighborhoodRadius: 6.2,
    pressure: 1.1,
    pressureMaxAccel: 1.9,
    pressureStart: 2.8,
    radialSpacing: 0.16,
    radialRange: 0.14,
    radialPressure: 0.46,
    radialHeightBand: 0.3,
  },
  collision: {
    friction: 0.52,
    restitution: 0.045,
    solverIterations: 12,
    internalPgsIterations: 4,
    ccdSubsteps: 8,
    contactSkin: 0.002,
    allowedLinearError: 0.0002,
    padding: 0.006,
  },
  selection: {
    target: [0, 0.32, 9.6],
    spring: 26,
    damping: 10,
    maxAccel: 42,
    angularSpring: 12,
    angularDamping: 5.5,
    windScale: 0.42,
    turbulenceScale: 0.16,
    dragScale: 2.4,
    angularDragScale: 3,
    targetWobble: 0.06,
    blendRate: 1.5,
    proximityRange: 2.4,
    proximityScale: 0.5,
    fieldYield: 0.82,
    wakeRange: 2.7,
    wakeAccel: 7,
    yaw: 0.05,
    pitch: -0.03,
    roll: 0.015,
  },
  pointer: {
    xHalfExtent: 5.8,
    yHalfExtent: 4.2,
    yCenter: 0.4,
    z: 3,
    radius: 2.6,
    swirl: 0.5,
    lift: 0.1,
  },
  aerodynamics: {
    gain: 0.27,
    linearDamping: 0.015,
  },
  physics: {
    fixedStep: 1 / 120,
    maxSubsteps: 5,
    maxFrameDelta: 0.05,
    maxSpeed: 7.5,
    maxAngularSpeed: 7,
    maxAcceleration: 30,
  },
  camera: {
    fov: 34,
    position: [0, 0.6, 26],
    target: [0, 0.5, 0],
    near: 0.1,
    far: 80,
    dpr: [1, 1.5],
  },
  atlas: {
    tileWidth: 448,
    columns: 7,
  },
};

const FULL_MOBILE: VortexEnvironment = {
  id: "mobile",
  population: 33,
  cardScale: 0.7,
  volume: {
    bottom: -5.2,
    top: 6.6,
    radiusBottom: 2.7,
    radiusMiddle: 2.05,
    radiusTop: 1.25,
    midBias: 0.5,
    organic: 0.055,
    innerRadius: 0.55,
    outerStart: 0.94,
    outerAllowance: 1.16,
    verticalInset: 0.22,
  },
  wind: {
    tangential: 1.32,
    vertical: 0.46,
    verticalVariation: 0.25,
    radial: 0.21,
    gustAmplitude: 0.22,
    gustRate: 0.19,
    boostPerEnergy: 0.95,
    maxEnergy: 1.6,
    energyDecay: 1.15,
    levelRate: 3.4,
    levelRelaxRate: 1.8,
    directionRate: 2.2,
    scrollGain: 0.0025,
    scrollImpulseMax: 1.8,
  },
  turbulence: {
    strength: 0.68,
    scale: 0.36,
    octaves: 2,
    timeScale: 0.14,
    torque: 0.7,
    torqueScale: 0.62,
  },
  containment: {
    outerStart: 0.93,
    outerStiffness: 9,
    outerDamping: 1.6,
    outerMaxAccel: 16,
    innerStiffness: 30,
    verticalStiffness: 9.5,
    verticalMaxAccel: 18,
    orbitalSupport: 0.9,
  },
  separation: {
    gap: 0.1,
    range: 0.36,
    stiffness: 4.4,
    damping: 1.1,
    maxAccel: 2.4,
    neighborhoodRadius: 5,
    pressure: 1.2,
    pressureMaxAccel: 1.9,
    pressureStart: 2.6,
    radialSpacing: 0.15,
    radialRange: 0.12,
    radialPressure: 0.5,
    radialHeightBand: 0.28,
  },
  collision: {
    friction: 0.5,
    restitution: 0.05,
    solverIterations: 12,
    internalPgsIterations: 4,
    ccdSubsteps: 8,
    contactSkin: 0.002,
    allowedLinearError: 0.0002,
    padding: 0.006,
  },
  selection: {
    target: [0, 0.1, 8.2],
    spring: 26,
    damping: 10,
    maxAccel: 38,
    angularSpring: 12,
    angularDamping: 5.5,
    windScale: 0.4,
    turbulenceScale: 0.14,
    dragScale: 2.4,
    angularDragScale: 3,
    targetWobble: 0.045,
    blendRate: 1.5,
    proximityRange: 2.1,
    proximityScale: 0.5,
    fieldYield: 0.8,
    wakeRange: 2.3,
    wakeAccel: 6,
    yaw: 0.04,
    pitch: -0.02,
    roll: 0.01,
  },
  pointer: {
    xHalfExtent: 2.6,
    yHalfExtent: 3.8,
    yCenter: 0.1,
    z: 2.6,
    radius: 2,
    swirl: 0.3,
    lift: 0.06,
  },
  aerodynamics: {
    gain: 0.3,
    linearDamping: 0.02,
  },
  physics: {
    fixedStep: 1 / 90,
    maxSubsteps: 4,
    maxFrameDelta: 0.05,
    maxSpeed: 6,
    maxAngularSpeed: 6,
    maxAcceleration: 26,
  },
  camera: {
    fov: 45,
    position: [0, 0.2, 19.5],
    target: [0, 0.1, 0],
    near: 0.1,
    far: 60,
    dpr: [1, 1.25],
  },
  atlas: {
    tileWidth: 320,
    columns: 7,
  },
};

export const FULL_ENVIRONMENTS = {
  desktop: FULL_DESKTOP,
  mobile: FULL_MOBILE,
} as const;

export function getVortexEnvironment(
  mobile: boolean,
  population: VortexPopulation = 5,
): VortexEnvironment {
  if (population === 33) {
    return structuredClone(mobile ? FULL_MOBILE : FULL_DESKTOP);
  }
  return structuredClone(mobile ? MOBILE : DESKTOP);
}
