"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

type ThemeApi = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeApi>({
  theme: "dark",
  toggleTheme: () => undefined,
});

export function useTheme(): ThemeApi {
  return useContext(ThemeContext);
}

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const themeRef = useRef<Theme>("dark");
  const shiftTimer = useRef<number>(0);

  useEffect(() => {
    const restored = readTheme();
    themeRef.current = restored;
    setTheme(restored);
  }, []);

  useEffect(
    () => () => {
      if (shiftTimer.current) window.clearTimeout(shiftTimer.current);
      document.documentElement.removeAttribute("data-theme-shift");
    },
    [],
  );

  const toggleTheme = useCallback(() => {
    const next: Theme = themeRef.current === "light" ? "dark" : "light";
    const root = document.documentElement;
    themeRef.current = next;
    root.dataset.theme = next;
    root.style.colorScheme = next;
    setTheme(next);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable: the theme still applies for this visit.
    }

    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (meta) meta.content = next === "light" ? "#f2f2f0" : "#000000";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.removeAttribute("data-theme-shift");
    // Restart the CSS exposure even when the visitor toggles quickly.
    void root.offsetWidth;
    root.dataset.themeShift = next === "light" ? "to-light" : "to-dark";
    if (shiftTimer.current) window.clearTimeout(shiftTimer.current);
    shiftTimer.current = window.setTimeout(() => {
      root.removeAttribute("data-theme-shift");
      shiftTimer.current = 0;
    }, 520);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
