export const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOTION_QUERY).matches;
}

export function getMotionPreference(): "reduce" | "full" {
  return prefersReducedMotion() ? "reduce" : "full";
}

export function subscribeToMotionPreference(
  callback: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
