"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createThemeSound } from "@/utils/theme-sound.mjs";

const AppearanceContext = createContext(null);
export const useAppearance = () => useContext(AppearanceContext);

export default function Appearance({ children }) {
  // Every visit starts light. Theme changes are local style updates for this visit.
  const [theme, setTheme] = useState("light");
  const audio = useRef(null);
  useLayoutEffect(() => {
    document.documentElement.dataset.portfolioTheme = "light";
  }, []);
  useEffect(() => () => audio.current?.dispose(), []);
  const choose = (next) => {
    if (next !== "light" && next !== "dark") return;
    audio.current ||= createThemeSound();
    audio.current.play(true);
    setTheme(next);
    document.documentElement.dataset.portfolioTheme = next;
  };
  return (
    <AppearanceContext.Provider value={{ theme, choose, performance: false }}>
      {children}
    </AppearanceContext.Provider>
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
          choose(theme === "light" ? "dark" : "light");
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
