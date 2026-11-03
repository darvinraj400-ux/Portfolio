"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { MotionConfig } from "motion/react";
import {
  getMotionSnapshot,
  getServerMotionSnapshot,
  setMotionPreference,
  subscribeMotionPreference,
  syncMotionDocument,
  type MotionMode,
  type MotionPreference,
} from "@/lib/motion";

type MotionPreferenceContextValue = {
  preference: MotionPreference;
  mode: MotionMode;
  reduced: boolean;
  systemReduced: boolean;
  setPreference: (preference: MotionPreference) => void;
};

const MotionPreferenceContext = createContext<MotionPreferenceContextValue>({
  preference: "system",
  mode: "full",
  reduced: false,
  systemReduced: false,
  setPreference: () => undefined,
});

export function MotionPreferenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const snapshot = useSyncExternalStore(
    subscribeMotionPreference,
    getMotionSnapshot,
    getServerMotionSnapshot,
  );

  useEffect(() => {
    syncMotionDocument();
  }, []);

  const value = useMemo<MotionPreferenceContextValue>(
    () => ({
      preference: snapshot.preference,
      mode: snapshot.mode,
      reduced: snapshot.mode === "reduced",
      systemReduced: snapshot.systemReduced,
      setPreference: setMotionPreference,
    }),
    [snapshot],
  );

  return (
    <MotionPreferenceContext.Provider value={value}>
      <MotionConfig
        reducedMotion={snapshot.mode === "reduced" ? "always" : "never"}
      >
        {children}
      </MotionConfig>
    </MotionPreferenceContext.Provider>
  );
}

export function useMotionPreference(): MotionPreferenceContextValue {
  return useContext(MotionPreferenceContext);
}
