export const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const MOTION_STORAGE_KEY = "darvin-motion-v1";

export type MotionPreference = "system" | "reduced" | "full";
export type MotionMode = "reduced" | "full";

export type MotionSnapshot = {
  preference: MotionPreference;
  systemReduced: boolean;
  mode: MotionMode;
};

const SERVER_SNAPSHOT: MotionSnapshot = {
  preference: "system",
  systemReduced: false,
  mode: "full",
};

function isMotionPreference(value: unknown): value is MotionPreference {
  return value === "system" || value === "reduced" || value === "full";
}

function resolveMode(
  preference: MotionPreference,
  systemReduced: boolean,
): MotionMode {
  if (preference === "full") return "full";
  if (preference === "reduced") return "reduced";
  return systemReduced ? "reduced" : "full";
}

function readPreference(): MotionPreference {
  try {
    const stored = window.localStorage.getItem(MOTION_STORAGE_KEY);
    return isMotionPreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function readSystemReduced(): boolean {
  try {
    return window.matchMedia(MOTION_QUERY).matches;
  } catch {
    return false;
  }
}

function computeSnapshot(): MotionSnapshot {
  const preference = readPreference();
  const systemReduced = readSystemReduced();
  return { preference, systemReduced, mode: resolveMode(preference, systemReduced) };
}

let snapshot: MotionSnapshot | null = null;
let mediaQuery: MediaQueryList | null = null;
const listeners = new Set<() => void>();

function syncDocument(current: MotionSnapshot) {
  if (typeof document === "undefined") return;
  const dataset = document.documentElement.dataset;
  if (dataset.motion !== current.mode) dataset.motion = current.mode;
  if (dataset.motionPreference !== current.preference) {
    dataset.motionPreference = current.preference;
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

function refresh() {
  const next = computeSnapshot();
  const previous = snapshot;
  snapshot = next;
  syncDocument(next);
  if (
    !previous ||
    previous.preference !== next.preference ||
    previous.systemReduced !== next.systemReduced
  ) {
    notify();
  }
}

function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== MOTION_STORAGE_KEY) return;
  refresh();
}

function startListening() {
  if (!mediaQuery && typeof window.matchMedia === "function") {
    mediaQuery = window.matchMedia(MOTION_QUERY);
    mediaQuery.addEventListener("change", refresh);
  }
  window.addEventListener("storage", onStorage);
}

function stopListening() {
  mediaQuery?.removeEventListener("change", refresh);
  mediaQuery = null;
  window.removeEventListener("storage", onStorage);
}

function ensureSnapshot(): MotionSnapshot {
  if (!snapshot) snapshot = computeSnapshot();
  return snapshot;
}

export function getMotionSnapshot(): MotionSnapshot {
  return ensureSnapshot();
}

export function getServerMotionSnapshot(): MotionSnapshot {
  return SERVER_SNAPSHOT;
}

export function subscribeMotionPreference(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  ensureSnapshot();
  listeners.add(callback);
  startListening();
  syncDocument(ensureSnapshot());
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0) stopListening();
  };
}

export function setMotionPreference(preference: MotionPreference): void {
  if (typeof window === "undefined") return;
  const systemReduced = readSystemReduced();
  const previous = ensureSnapshot();
  if (
    previous.preference === preference &&
    previous.systemReduced === systemReduced
  ) {
    return;
  }
  const next: MotionSnapshot = {
    preference,
    systemReduced,
    mode: resolveMode(preference, systemReduced),
  };
  snapshot = next;
  try {
    window.localStorage.setItem(MOTION_STORAGE_KEY, preference);
  } catch {
    // Storage unavailable: the choice still applies for this visit.
  }
  syncDocument(next);
  notify();
}

/** Applies the stored effective mode to the document after hydration. */
export function syncMotionDocument(): void {
  if (typeof window === "undefined") return;
  syncDocument(ensureSnapshot());
}

export function isMotionReduced(): boolean {
  if (typeof window === "undefined") return false;
  return ensureSnapshot().mode === "reduced";
}

/**
 * Runs before paint so the first frame already carries the effective mode.
 * A missing or unreadable store falls back to the system setting.
 */
export const MOTION_BOOTSTRAP_SCRIPT = `(function(){try{
var stored=null;
try{stored=window.localStorage.getItem(${JSON.stringify(MOTION_STORAGE_KEY)})}catch(e){}
var preference=stored==="system"||stored==="reduced"||stored==="full"?stored:"system";
var reduced=false;
try{reduced=!!(window.matchMedia&&window.matchMedia(${JSON.stringify(MOTION_QUERY)}).matches)}catch(e){}
var mode=preference==="full"?"full":preference==="reduced"?"reduced":(reduced?"reduced":"full");
var root=document.documentElement;
root.setAttribute("data-motion",mode);
root.setAttribute("data-motion-preference",preference);
}catch(e){
try{
var fallback=document.documentElement;
fallback.setAttribute("data-motion","full");
fallback.setAttribute("data-motion-preference","system");
}catch(e2){}
}})();`;
