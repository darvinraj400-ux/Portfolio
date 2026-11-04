"use client";

import { useSyncExternalStore } from "react";

export const LANDING_STEPS = [
  "data",
  "fonts",
  "layout",
  "atlas",
  "world",
  "renderer",
  "frame",
] as const;

export type LandingStep = (typeof LANDING_STEPS)[number];
export type LandingMode = "scene" | "fallback";

export type LandingSnapshot = {
  mode: LandingMode;
  steps: Record<LandingStep, boolean>;
  required: readonly LandingStep[];
  completed: number;
  progress: number;
  current: LandingStep | null;
  ready: boolean;
};

/** The static archive needs no 3D preparation, only the page itself. */
const FALLBACK_REQUIRED: readonly LandingStep[] = ["data", "fonts", "layout"];

const steps: Record<LandingStep, boolean> = {
  data: false,
  fonts: false,
  layout: false,
  atlas: false,
  world: false,
  renderer: false,
  frame: false,
};
let mode: LandingMode = "scene";

function buildSnapshot(): LandingSnapshot {
  const required = mode === "fallback" ? FALLBACK_REQUIRED : LANDING_STEPS;
  let completed = 0;
  let current: LandingStep | null = null;
  for (const step of required) {
    if (steps[step]) completed += 1;
    else if (current === null) current = step;
  }
  return {
    mode,
    steps: { ...steps },
    required,
    completed,
    progress: required.length === 0 ? 1 : completed / required.length,
    current,
    ready: current === null,
  };
}

let snapshot = buildSnapshot();
const listeners = new Set<() => void>();

function emit() {
  snapshot = buildSnapshot();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function reportLandingStep(step: LandingStep) {
  if (steps[step]) return;
  steps[step] = true;
  emit();
}

/**
 * Called when WebGL is unavailable or the scene failed: the static archive
 * becomes the entry experience, so its shorter requirements govern the gate.
 */
export function reportLandingFallback() {
  if (mode === "fallback") return;
  mode = "fallback";
  emit();
}

const SERVER_SNAPSHOT = buildSnapshot();

export function useLandingReadiness(): LandingSnapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
}
