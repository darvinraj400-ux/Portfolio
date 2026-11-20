export const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const MOTION_STORAGE_KEY = "darvin-motion-v1";

export type MotionMode = "reduced" | "full";
export type MotionPreference = "system" | "full";

export type MotionSnapshot = {
  preference: MotionPreference;
  mode: MotionMode;
};

const SERVER_SNAPSHOT: MotionSnapshot = { preference: "system", mode: "full" };

function readSystemReduced(): boolean {
  try {
    return window.matchMedia(MOTION_QUERY).matches;
  } catch {
    return false;
  }
}

function readPreference(): MotionPreference {
  try {
    return window.localStorage.getItem(MOTION_STORAGE_KEY) === "full"
      ? "full"
      : "system";
  } catch {
    return "system";
  }
}

function computeSnapshot(): MotionSnapshot {
  const preference = readPreference();
  const reduced = preference !== "full" && readSystemReduced();
  return { preference, mode: reduced ? "reduced" : "full" };
}

let snapshot: MotionSnapshot | null = null;
let mediaQuery: MediaQueryList | null = null;
const listeners = new Set<() => void>();

function syncDocument(current: MotionSnapshot) {
  if (typeof document === "undefined") return;
  const dataset = document.documentElement.dataset;
  if (dataset.motion !== current.mode) dataset.motion = current.mode;
}

function notify() {
  listeners.forEach((listener) => listener());
}

function refresh() {
  const next = computeSnapshot();
  const previous = snapshot;
  snapshot = next;
  syncDocument(next);
  if (!previous || previous.mode !== next.mode) notify();
}

function startListening() {
  if (!mediaQuery && typeof window.matchMedia === "function") {
    mediaQuery = window.matchMedia(MOTION_QUERY);
    mediaQuery.addEventListener("change", refresh);
  }
  window.addEventListener("storage", onStorageChange);
}

function stopListening() {
  mediaQuery?.removeEventListener("change", refresh);
  mediaQuery = null;
  window.removeEventListener("storage", onStorageChange);
}

function onStorageChange(event: StorageEvent) {
  if (event.key !== null && event.key !== MOTION_STORAGE_KEY) return;
  refresh();
}

export function setMotionPreference(preference: MotionPreference): void {
  if (typeof window === "undefined") return;
  try {
    if (preference === "full") {
      window.localStorage.setItem(MOTION_STORAGE_KEY, "full");
    } else {
      window.localStorage.removeItem(MOTION_STORAGE_KEY);
    }
  } catch {
    // Storage can be blocked; the in-memory snapshot still applies.
  }
  refresh();
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

/** Applies the system mode to the document after hydration. */
export function syncMotionDocument(): void {
  if (typeof window === "undefined") return;
  syncDocument(ensureSnapshot());
}

export function isMotionReduced(): boolean {
  if (typeof window === "undefined") return false;
  return ensureSnapshot().mode === "reduced";
}

/**
 * Runs before paint so the first frame already carries the system mode or the
 * stored full-motion override.
 */
export const MOTION_BOOTSTRAP_SCRIPT = `(function(){try{
var full=false;
try{full=localStorage.getItem(${JSON.stringify(MOTION_STORAGE_KEY)})==="full"}catch(e){}
var reduced=false;
if(!full){try{reduced=!!(window.matchMedia&&window.matchMedia(${JSON.stringify(MOTION_QUERY)}).matches)}catch(e){}}
document.documentElement.setAttribute("data-motion",reduced?"reduced":"full");
}catch(e){
try{document.documentElement.setAttribute("data-motion","full")}catch(e2){}
}})();`;
