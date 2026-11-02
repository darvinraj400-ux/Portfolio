export type Vec3Tuple = [number, number, number];

export type QuatTuple = [number, number, number, number];

export type VortexProject = {
  index: string;
  slug: string;
  name: string;
  titleLines: string[];
  category: string;
  shortDescription?: string;
};

export type VortexInventoryEntry = {
  id: string;
  slug: string;
  name: string;
  category: string;
};

/**
 * Mutable values written by the page (scroll, pointer) and read inside the
 * fixed-step simulation. Kept outside React so wind input never re-renders.
 */
export type VortexInput = {
  /** Wind energy added by recent scrolling, consumed by the simulation. */
  scrollImpulse: number;
  scrollDirection: 1 | -1;
  pointerX: number;
  pointerY: number;
  pointerActive: boolean;
};

export type VortexCardSnapshot = {
  id: string;
  slug: string;
  category: string;
  name: string;
  selected: boolean;
  position: Vec3Tuple;
  velocity: Vec3Tuple;
  angularVelocity: Vec3Tuple;
  quaternion: QuatTuple;
  halfExtents: Vec3Tuple;
  speed: number;
  angularSpeed: number;
  mass: number;
  drag: number;
  angularDrag: number;
  windResponse: number;
  localWind: Vec3Tuple;
  localWindSpeed: number;
  radiusRatio: number;
};

export type VortexContactSnapshot = {
  a: number;
  b: number;
  distance: number;
  normal: Vec3Tuple;
  point: Vec3Tuple;
  impulse: number;
};

export type VortexCollisionSnapshot = {
  diagnostics: boolean;
  contacts: VortexContactSnapshot[];
  activePairs: number;
  contactSteps: number;
  overlapSteps: number;
  stepCount: number;
  maxPenetration: number;
  minClearance: number;
  solverIterations: number;
  internalPgsIterations: number;
  ccdSubsteps: number;
  allowedLinearError: number;
};

export type VortexDistributionSnapshot = {
  lower: number;
  middle: number;
  upper: number;
  inner: number;
  mid: number;
  outer: number;
  depthBack: number;
  depthMid: number;
  depthFront: number;
  meanNearestGap: number;
  minGap: number;
  meanPairGap: number;
  meanRadiusRatio: number;
  verticalSpread: number;
  radialSpread: number;
  depthSpread: number;
  crowdings: number[];
};

export type VortexHealth = {
  finite: boolean;
  maxSpeed: number;
  maxAngularSpeed: number;
  maxRadiusRatio: number;
  minSeparation: number;
  verticalOverrun: number;
};

export type VortexSnapshot = {
  time: number;
  population: number;
  fps: number;
  stepMs: number;
  peakStepMs: number;
  stepsLastFrame: number;
  fixedStep: number;
  windLevel: number;
  spinDirection: number;
  turbulenceLevel: number;
  windEnergy: number;
  selected: string | null;
  bodies: VortexCardSnapshot[];
  health: VortexHealth;
  collision: VortexCollisionSnapshot;
  distribution: VortexDistributionSnapshot;
};

export type VortexBodyState = {
  id: string;
  position: Vec3Tuple;
  quaternion: QuatTuple;
  velocity: Vec3Tuple;
  angularVelocity: Vec3Tuple;
  selectionBlend: number;
};

export type VortexWorldState = {
  time: number;
  windLevel: number;
  spinDirection: number;
  turbulenceLevel: number;
  scrollEnergy: number;
  selected: number | null;
  bodies: VortexBodyState[];
};

export type VortexViewportState = {
  width: number;
  height: number;
  aspect: number;
  dpr: number;
};

export type VortexCameraState = {
  position: Vec3Tuple;
  target: Vec3Tuple;
  fov: number;
  aspect: number;
  near: number;
  far: number;
  zoom: number;
  stageTop: number;
  stageHeight: number;
  scrollY: number;
};

export type VortexSceneState = {
  version: number;
  savedAt: number;
  profile: "desktop" | "mobile";
  population: number;
  viewport: VortexViewportState;
  camera: VortexCameraState;
  world: VortexWorldState;
};

export type VortexLampReport = {
  enabled: boolean;
  intensity: number;
  position: Vec3Tuple;
  environmentIntensity: number;
  backlight: number;
  exposure: number;
  energy: number;
  selected: boolean;
};

export type VortexScenarioName =
  | "idle"
  | "face-first"
  | "edge-first"
  | "angled"
  | "rotating"
  | "slow"
  | "fast-gust"
  | "reverse-wind"
  | "multi-close"
  | "selected-collision"
  | "independent-spin";

export type VortexDebugHandle = {
  snapshot: () => VortexSnapshot;
  restoreTrace: () => VortexWorldState | null;
  scene: () => VortexSceneState | null;
  inventory: () => VortexInventoryEntry[];
  collisionReport: () => VortexCollisionSnapshot;
  resetCollisionMetrics: () => void;
  applyScenario: (name: VortexScenarioName) => boolean;
  setGust: (energy: number, direction: 1 | -1) => void;
  select: (index: number | null) => void;
  setDiagnostics: (enabled: boolean) => void;
  setLamp: (enabled: boolean) => void;
  setFrozen: (frozen: boolean) => void;
  lamp: () => VortexLampReport | null;
};
