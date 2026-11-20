"use client";

import {
  createContext,
  useCallback,
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
  type MotionPreference,
} from "@/lib/motion";

type MotionPreferenceContextValue = {
  reduced: boolean;
  preference: MotionPreference;
  setPreference: (preference: MotionPreference) => void;
};

const MotionPreferenceContext = createContext<MotionPreferenceContextValue>({
  reduced: false,
  preference: "system",
  setPreference: () => {},
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
  const reduced = snapshot.mode === "reduced";

  useEffect(() => {
    syncMotionDocument();
  }, []);

  const setPreference = useCallback((next: MotionPreference) => {
    setMotionPreference(next);
  }, []);

  const value = useMemo(
    () => ({ reduced, preference: snapshot.preference, setPreference }),
    [reduced, setPreference, snapshot.preference],
  );

  return (
    <MotionPreferenceContext.Provider value={value}>
      <MotionConfig reducedMotion={reduced ? "always" : "never"}>
        {children}
      </MotionConfig>
    </MotionPreferenceContext.Provider>
  );
}

export function useMotionPreference(): MotionPreferenceContextValue {
  return useContext(MotionPreferenceContext);
}
