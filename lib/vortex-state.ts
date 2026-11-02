import type {
  QuatTuple,
  Vec3Tuple,
  VortexBodyState,
  VortexSceneState,
  VortexWorldState,
} from "./vortex-types";

export const VORTEX_SCENE_VERSION = 1;

const STORAGE_KEY = "darvin-vortex-return-v1";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isVec3 = (value: unknown): value is Vec3Tuple =>
  Array.isArray(value) && value.length === 3 && value.every(isFiniteNumber);

const isQuat = (value: unknown): value is QuatTuple => {
  if (!Array.isArray(value) || value.length !== 4) return false;
  if (!value.every(isFiniteNumber)) return false;
  const length = Math.hypot(
    value[0] as number,
    value[1] as number,
    value[2] as number,
    value[3] as number,
  );
  return length > 0.5 && length < 1.5;
};

const isBody = (value: unknown): value is VortexBodyState =>
  isRecord(value) &&
  typeof value.id === "string" &&
  value.id.length > 0 &&
  isVec3(value.position) &&
  isQuat(value.quaternion) &&
  isVec3(value.velocity) &&
  isVec3(value.angularVelocity) &&
  isFiniteNumber(value.selectionBlend);

const isWorld = (value: unknown): value is VortexWorldState => {
  if (!isRecord(value)) return false;
  const bodies = value.bodies;
  if (!Array.isArray(bodies) || bodies.length === 0 || bodies.length > 64) {
    return false;
  }
  const selected = value.selected;
  return (
    isFiniteNumber(value.time) &&
    value.time >= 0 &&
    isFiniteNumber(value.windLevel) &&
    value.windLevel >= 0 &&
    isFiniteNumber(value.spinDirection) &&
    isFiniteNumber(value.turbulenceLevel) &&
    isFiniteNumber(value.scrollEnergy) &&
    value.scrollEnergy >= 0 &&
    (selected === null ||
      (Number.isInteger(selected) && (selected as number) >= 0)) &&
    bodies.every(isBody)
  );
};

const isScene = (value: unknown): value is VortexSceneState => {
  if (!isRecord(value)) return false;
  if (value.version !== VORTEX_SCENE_VERSION) return false;
  if (value.profile !== "desktop" && value.profile !== "mobile") return false;
  if (
    !Number.isInteger(value.population) ||
    (value.population as number) < 1
  ) {
    return false;
  }
  if (!isWorld(value.world)) return false;
  if (value.world.bodies.length !== value.population) return false;
  if (
    value.world.selected !== null &&
    (value.world.selected as number) >= value.world.bodies.length
  ) {
    return false;
  }
  if (!isRecord(value.viewport) || !isRecord(value.camera)) return false;
  const viewport = value.viewport;
  const camera = value.camera;
  if (
    !isFiniteNumber(viewport.width) ||
    viewport.width <= 0 ||
    !isFiniteNumber(viewport.height) ||
    viewport.height <= 0 ||
    !isFiniteNumber(viewport.aspect) ||
    viewport.aspect <= 0 ||
    !isFiniteNumber(viewport.dpr) ||
    viewport.dpr <= 0
  ) {
    return false;
  }
  return (
    isVec3(camera.position) &&
    isVec3(camera.target) &&
    isFiniteNumber(camera.fov) &&
    camera.fov > 0 &&
    isFiniteNumber(camera.aspect) &&
    camera.aspect > 0 &&
    isFiniteNumber(camera.near) &&
    camera.near > 0 &&
    isFiniteNumber(camera.far) &&
    camera.far > camera.near &&
    isFiniteNumber(camera.zoom) &&
    camera.zoom > 0 &&
    isFiniteNumber(camera.stageTop) &&
    isFiniteNumber(camera.stageHeight) &&
    isFiniteNumber(camera.scrollY)
  );
};

// Session storage can fail (private mode, quota, disabled). The copy below
// keeps restoration working for client-side navigation in that case.
let memoryScene: VortexSceneState | null = null;

export function saveVortexScene(scene: VortexSceneState): void {
  memoryScene = scene;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(scene));
  } catch {
    // Keep the in-memory copy.
  }
}

export function loadVortexScene(): VortexSceneState | null {
  if (memoryScene) return memoryScene;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isScene(parsed)) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    memoryScene = parsed;
    return parsed;
  } catch {
    return null;
  }
}
