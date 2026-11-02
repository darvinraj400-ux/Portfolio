"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { MotionConfig } from "motion/react";
import {
  MOTION_QUERY,
  subscribeToMotionPreference,
} from "@/lib/motion";

type MotionPreference = {
  reduced: boolean;
  preference: "reduce" | "full";
};

const MotionPreferenceContext = createContext<MotionPreference>({
  reduced: false,
  preference: "full",
});

function getClientSnapshot(): boolean {
  return window.matchMedia(MOTION_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function MotionPreferenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const reduced = useSyncExternalStore(
    subscribeToMotionPreference,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
  }, [reduced]);

  return (
    <MotionPreferenceContext.Provider
      value={{ reduced, preference: reduced ? "reduce" : "full" }}
    >
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </MotionPreferenceContext.Provider>
  );
}

export function useMotionPreference(): MotionPreference {
  return useContext(MotionPreferenceContext);
}
