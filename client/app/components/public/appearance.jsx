"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createThemeSound } from "@/utils/theme-sound.mjs";

const AppearanceContext = createContext(null);
const PerformanceContext = createContext(false);
export const useAppearance = () => useContext(AppearanceContext);
export const usePerformanceMode = () => useContext(PerformanceContext);

export default function Appearance({ children }) {
  // Every visit starts dark. Theme changes are local style updates for this visit.
  const [theme, setTheme] = useState("dark");
  const audio = useRef(null);
  const audioFrame = useRef(0);
  const selected = useRef("dark");
  useLayoutEffect(() => {
    document.documentElement.dataset.portfolioTheme = "dark";
  }, []);
  useEffect(() => () => {
    cancelAnimationFrame(audioFrame.current);
    audio.current?.dispose();
  }, []);
  const choose = useCallback((next) => {
    if (next !== "light" && next !== "dark") return;
    if (next === selected.current) return;
    selected.current = next;
    // Paint the CSS palette immediately; effect recoloring is a concurrent update.
    document.documentElement.dataset.portfolioTheme = next;
    startTransition(() => setTheme(next));
    cancelAnimationFrame(audioFrame.current);
    audioFrame.current = requestAnimationFrame(() => {
      audioFrame.current = requestAnimationFrame(() => {
        audio.current ||= createThemeSound();
        audio.current.play(true);
      });
    });
  }, []);
  const value = useMemo(() => ({ theme, choose, performance: false }), [theme, choose]);
  return (
    <PerformanceContext.Provider value={false}>
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
    </PerformanceContext.Provider>
  );
}

export function AppearanceControls() {
  const { theme, choose } = useAppearance();
  const [pull, setPull] = useState(false);
  return (
    <div className="pf-appearance">
      <button
        type="button"
        className={`pf-lamp ${pull ? "pf-pull" : ""}`}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        aria-pressed={theme === "dark"}
        onAnimationEnd={() => setPull(false)}
        onClick={() => {
          setPull(true);
          choose(document.documentElement.dataset.portfolioTheme === "light" ? "dark" : "light");
        }}
      >
        <svg viewBox="0 0 44 44" width="36" height="36" aria-hidden="true">
          <path
            d="M22 0v8m-8 0h16l6 15H8Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <g className="pf-lamp-cord">
            <path d="M22 23v13" stroke="currentColor" />
            <circle cx="22" cy="38" r="2" fill="currentColor" />
          </g>
        </svg>
        <small>{theme === "light" ? "Light" : "Dark"}</small>
      </button>
    </div>
  );
}
