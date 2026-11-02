"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AudioEngine } from "@/lib/audio/audio-engine";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  clampVolume,
  sanitizeSettings,
  type SoundSettings,
} from "@/lib/audio/audio-config";

export type SoundStatus = "off" | "starting" | "on" | "waiting" | "blocked";

type SoundApi = {
  musicOn: boolean;
  clickOn: boolean;
  musicVolume: number;
  status: SoundStatus;
  toggleMusic: () => void;
  toggleClick: () => void;
  setMusicVolume: (value: number) => void;
  playClick: () => void;
};

const noop = () => undefined;

const CLICKABLE =
  'a[href], button, [role="button"], [role="switch"], summary, label, input[type="checkbox"], input[type="radio"]';

const SoundContext = createContext<SoundApi>({
  musicOn: true,
  clickOn: true,
  musicVolume: DEFAULT_SETTINGS.musicVolume,
  status: "off",
  toggleMusic: noop,
  toggleClick: noop,
  setMusicVolume: noop,
  playClick: noop,
});

export function useSound(): SoundApi {
  return useContext(SoundContext);
}

function readSettings(): SoundSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return sanitizeSettings(JSON.parse(raw)) ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(settings: SoundSettings) {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable: keep the in-memory preference.
  }
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef<AudioEngine | null>(null);
  const [status, setStatus] = useState<SoundStatus>("off");
  const [musicOn, setMusicOn] = useState(DEFAULT_SETTINGS.musicEnabled);
  const [clickOn, setClickOn] = useState(DEFAULT_SETTINGS.clickEnabled);
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SETTINGS);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const musicOnRef = useRef(musicOn);
  musicOnRef.current = musicOn;
  const clickOnRef = useRef(clickOn);
  clickOnRef.current = clickOn;
  const retryUsedRef = useRef(false);
  const startAttemptRef = useRef(0);

  const getEngine = useCallback(() => {
    const engine = engineRef.current ?? new AudioEngine(settingsRef.current);
    engineRef.current = engine;
    return engine;
  }, []);

  // Keep the ref, state and storage in one write so the render-time ref sync
  // cannot revert a toggle made between renders.
  const commitSettings = useCallback((patch: Partial<SoundSettings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    persistSettings(next);
    return next;
  }, []);

  const startMusicAttempt = useCallback(async () => {
    const attempt = ++startAttemptRef.current;
    setStatus("starting");
    const ok = await getEngine().startMusic();
    // A stale start (OFF, or a newer ON) must not overwrite current state.
    if (attempt !== startAttemptRef.current) return ok;
    if (!musicOnRef.current) {
      setStatus(clickOnRef.current ? "on" : "off");
      return false;
    }
    setStatus(ok ? "on" : "waiting");
    return ok;
  }, [getEngine]);

  useEffect(() => {
    const stored = readSettings();
    settingsRef.current = stored;
    setSettings(stored);
    setMusicOn(stored.musicEnabled);
    setClickOn(stored.clickEnabled);

    const engine = getEngine();
    engine.setMusicVolume(stored.musicVolume);
    if (stored.musicEnabled || stored.clickEnabled) engine.preload();
    if (stored.musicEnabled) {
      void startMusicAttempt();
    } else {
      setStatus("off");
    }
  }, [getEngine, startMusicAttempt]);

  useEffect(() => {
    if (!musicOn || status !== "waiting" || retryUsedRef.current) return;

    const remove = () => {
      window.removeEventListener("pointerdown", retry, true);
      window.removeEventListener("keydown", retry, true);
      window.removeEventListener("touchstart", retry, true);
    };
    const retry = () => {
      retryUsedRef.current = true;
      remove();
      void startMusicAttempt();
    };

    window.addEventListener("pointerdown", retry, {
      capture: true,
      passive: true,
    });
    window.addEventListener("keydown", retry, {
      capture: true,
      passive: true,
    });
    window.addEventListener("touchstart", retry, {
      capture: true,
      passive: true,
    });
    return remove;
  }, [musicOn, startMusicAttempt, status]);

  const toggleMusic = useCallback(() => {
    if (musicOnRef.current) {
      musicOnRef.current = false;
      setMusicOn(false);
      commitSettings({ musicEnabled: false });
      engineRef.current?.stopMusic();
      setStatus(clickOnRef.current ? "on" : "off");
      return;
    }

    musicOnRef.current = true;
    setMusicOn(true);
    commitSettings({ musicEnabled: true });
    void startMusicAttempt();
  }, [commitSettings, startMusicAttempt]);

  const toggleClick = useCallback(() => {
    if (clickOnRef.current) {
      clickOnRef.current = false;
      setClickOn(false);
      commitSettings({ clickEnabled: false });
      setStatus(musicOnRef.current ? "on" : "off");
      return;
    }

    clickOnRef.current = true;
    setClickOn(true);
    commitSettings({ clickEnabled: true });
    const arm = async () => {
      setStatus("starting");
      const engine = getEngine();
      const ok = await engine.armClick();
      if (!clickOnRef.current) {
        setStatus(musicOnRef.current ? "on" : "off");
        return;
      }
      if (!ok) {
        setStatus("waiting");
        return;
      }
      setStatus("on");
      engine.playClick(true);
    };
    void arm();
  }, [commitSettings, getEngine]);

  const setMusicVolume = useCallback(
    (value: number) => {
      const next = commitSettings({ musicVolume: clampVolume(value) });
      engineRef.current?.setMusicVolume(next.musicVolume);
    },
    [commitSettings],
  );

  const playClick = useCallback(() => {
    if (!clickOnRef.current) return;
    getEngine().playClick();
  }, [getEngine]);

  useEffect(() => {
    if (!clickOn) return;
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const hit = target.closest(CLICKABLE);
      if (!hit || hit.closest("[data-sound-silent]")) return;
      if (hit instanceof HTMLButtonElement && hit.disabled) return;
      if (hit.getAttribute("aria-disabled") === "true") return;
      engineRef.current?.playClick();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [clickOn]);

  useEffect(
    () => () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    },
    [],
  );

  const api = useMemo<SoundApi>(
    () => ({
      musicOn,
      clickOn,
      musicVolume: settings.musicVolume,
      status,
      toggleMusic,
      toggleClick,
      setMusicVolume,
      playClick,
    }),
    [
      clickOn,
      musicOn,
      playClick,
      setMusicVolume,
      settings.musicVolume,
      status,
      toggleClick,
      toggleMusic,
    ],
  );

  return <SoundContext.Provider value={api}>{children}</SoundContext.Provider>;
}
