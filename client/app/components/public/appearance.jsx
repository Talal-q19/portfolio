"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

import { createThemeSound } from "@/utils/theme-sound.mjs";

const AppearanceContext = createContext(null);
export const useAppearance = () => useContext(AppearanceContext);

export default function Appearance({ children }) {
  const [preference, setPreference] = useState("system");
  const [theme, setTheme] = useState("light");
  const [sound, setSound] = useState(false);
  const [performance, setPerformance] = useState(false);
  const audio = useRef(null);
  useEffect(() => {
    const query = matchMedia("(prefers-color-scheme: dark)");
    const restore = () => {
      let p = "system";
      let s = false;
      let simple = false;
      try {
        p = localStorage.getItem("portfolio-appearance");
        s = localStorage.getItem("portfolio-sound") === "on";
        simple = localStorage.getItem("portfolio-performance") === "static";
      } catch {}
      if (!["system", "light", "dark"].includes(p)) p = "system";
      const resolved = p === "system" ? (query.matches ? "dark" : "light") : p;
      document.documentElement.dataset.portfolioTheme = resolved;
      document.documentElement.dataset.portfolioPreference = p;
      setPreference(p);
      setTheme(resolved);
      setSound(s);
      setPerformance(simple);
    };
    restore();
    const systemChange = () => {
      if (document.documentElement.dataset.portfolioPreference !== "system")
        return;
      const next = query.matches ? "dark" : "light";
      document.documentElement.dataset.portfolioTheme = next;
      setTheme(next);
    };
    query.addEventListener("change", systemChange);
    return () => {
      query.removeEventListener("change", systemChange);
      audio.current?.dispose();
    };
  }, []);

  const click = () => {
    if (!sound) return;
    audio.current ||= createThemeSound();
    audio.current.play(true);
  };
  const choose = (next) => {
    click();
    const resolved =
      next === "system"
        ? matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : next;
    setPreference(next);
    setTheme(resolved);
    document.documentElement.dataset.portfolioPreference = next;
    document.documentElement.dataset.portfolioTheme = resolved;
    try {
      localStorage.setItem("portfolio-appearance", next);
    } catch {}
  };
  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    if (!next) audio.current?.mute();
    try {
      localStorage.setItem("portfolio-sound", next ? "on" : "off");
    } catch {}
  };
  const togglePerformance = () => {
    setPerformance(!performance);
    try {
      localStorage.setItem(
        "portfolio-performance",
        !performance ? "static" : "auto",
      );
    } catch {}
  };
  return (
    <AppearanceContext.Provider
      value={{
        preference,
        theme,
        sound,
        choose,
        toggleSound,
        performance,
        togglePerformance,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function AppearanceControls() {
  const {
    theme,
    preference,
    sound,
    choose,
    toggleSound,
    performance,
    togglePerformance,
  } = useAppearance();
  const [pull, setPull] = useState(false);
  return (
    <div className="pf-appearance">
      <button
        type="button"
        className="pf-mute"
        aria-pressed={sound}
        onClick={toggleSound}
        aria-label={sound ? "Mute theme sound" : "Enable theme sound"}
      >
        <span aria-hidden="true">{sound ? "♫" : "♪ ×"}</span>
        <small>{sound ? "Sound on" : "Muted"}</small>
      </button>
      <button
        type="button"
        className={`pf-lamp ${pull ? "pf-pull" : ""}`}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
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
      <details className="pf-appearance-menu">
        <summary aria-label="Appearance settings">Appearance</summary>
        <div>
          <p>Appearance</p>
          {["system", "light", "dark"].map((p) => (
            <button
              type="button"
              key={p}
              aria-pressed={preference === p}
              onClick={() => choose(p)}
            >
              {p[0].toUpperCase() + p.slice(1)} {preference === p && "✓"}
            </button>
          ))}
          <button type="button" onClick={toggleSound} aria-pressed={sound}>
            Theme sound: {sound ? "On" : "Muted"}
          </button>
          <button
            type="button"
            onClick={togglePerformance}
            aria-pressed={performance}
          >
            Reduce visual effects {performance ? "✓" : ""}
          </button>
        </div>
      </details>
    </div>
  );
}
