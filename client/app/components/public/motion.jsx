"use client";

import { Component, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useAppearance } from "./appearance";
import { motionPolicy } from "@/utils/motion-policy.mjs";

const CrystalizedBall = dynamic(() => import("./effects/CrystalizedBall"), {
  ssr: false,
});
const Threads = dynamic(() => import("./effects/Threads"), { ssr: false });
const GlowCursor = dynamic(() => import("./effects/GlowCursor"), {
  ssr: false,
});

class EffectBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// Conservative opt-in to animation. CSS fallbacks remain underneath the canvas.
export function useMotionPolicy() {
  const { performance: simple } = useAppearance();
  const [policy, setPolicy] = useState({
    desktop: false,
    fine: false,
    hidden: true,
    gpu: false,
  });
  useEffect(() => {
    const desktop = matchMedia("(min-width: 768px)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    let capable = false;
    try {
      const gl = document.createElement("canvas").getContext("webgl2");
      capable = !!gl;
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {}
    const update = () =>
      setPolicy(
        motionPolicy({
          desktop: desktop.matches,
          reduced: reduced.matches,
          fine: fine.matches,
          hidden: document.hidden,
          webgl: capable,
          simple,
          cores: navigator.hardwareConcurrency || 4,
          memory: navigator.deviceMemory || 4,
          saveData: navigator.connection?.saveData,
        }),
      );
    update();
    for (const q of [desktop, reduced, fine])
      q.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      for (const q of [desktop, reduced, fine])
        q.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [simple]);
  return policy;
}

// Prepare nearby effects once, then retain their GPU resources while pausing offscreen.
function useEffectStage() {
  const host = useRef(null);
  const [state, setState] = useState({
    primed: false,
    visible: false,
    ready: false,
    failed: false,
  });
  useEffect(() => {
    const el = host.current;
    const nearby = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setState((s) => ({ ...s, primed: true }));
      },
      { rootMargin: "480px" },
    );
    const visible = new IntersectionObserver(([entry]) =>
      setState((s) => ({ ...s, visible: entry.isIntersecting })),
    );
    const fail = () => setState((s) => ({ ...s, failed: true }));
    nearby.observe(el);
    visible.observe(el);
    el.addEventListener("webglcontextlost", fail, true);
    return () => {
      nearby.disconnect();
      visible.disconnect();
      el.removeEventListener("webglcontextlost", fail, true);
    };
  }, []);
  const ready = useCallback(() => setState((s) => ({ ...s, ready: true })), []);
  const fail = useCallback(() => setState((s) => ({ ...s, failed: true })), []);
  const mount = useCallback((element) => {
    if (element) setState((s) => (s.ready ? { ...s, ready: false } : s));
  }, []);
  return { host, ...state, onReady: ready, onFailure: fail, onMount: mount };
}

export function ContactCrystal({ policy }) {
  const { theme } = useAppearance();
  const { host, primed, visible, ready, failed, onReady, onFailure, onMount } =
    useEffectStage();
  const rendered = ready && !failed && policy.supported && policy.desktop;
  return (
    <div
      ref={host}
      className="pf-crystal pf-crystal--contact"
      data-ready={rendered}
      data-theme={theme}
      aria-hidden="true"
    >
      <div className="pf-crystal-static" />
      {policy.desktop && policy.supported && primed && !failed && (
        <div ref={onMount} className="pf-effect-canvas">
          <EffectBoundary>
            <CrystalizedBall
              preset="plasma"
              theme={theme}
              color={theme === "dark" ? "#B798FF" : "#2454D6"}
              size={0.8}
              strands={5}
              crackle={0.65}
              flares={0.45}
              glow={1.15}
              sparks={0.35}
              particleCount={4000}
              fill={0.6}
              motion="drift"
              particleShape="round"
              depth={0.65}
              sway={0.35}
              twinkle={0.3}
              haze={0.25}
              speed={0.6}
              dustSpeed={0.5}
              interactive
              hoverStrength={0.65}
              intro={false}
              paused={!visible || policy.hidden}
              onReady={onReady}
              onFailure={onFailure}
            />
          </EffectBoundary>
        </div>
      )}
    </div>
  );
}

export function ExperienceThreads({ policy }) {
  const { theme } = useAppearance();
  const { host, primed, visible, ready, failed, onReady, onFailure, onMount } =
    useEffectStage();
  const rendered = ready && !failed && policy.supported && policy.desktop;
  return (
    <div
      ref={host}
      className="pf-experience-visual"
      data-ready={rendered}
      aria-hidden="true"
    >
      <span>Event-driven, by design.</span>
      <div className="pf-threads-art">
        <svg className="pf-threads-static" viewBox="0 0 350 200" fill="none">
          {Array.from({ length: 18 }, (_, i) => (
            <path
              key={i}
              d={`M-20 ${65 + i * 3} C90 ${210 - i * 3}, 190 ${-70 + i * 6}, 370 ${90 + i * 2}`}
              stroke="currentColor"
              opacity={0.15 + i * 0.025}
            />
          ))}
        </svg>
        {policy.desktop && policy.supported && primed && !failed && (
          <div ref={onMount} className="pf-effect-canvas">
            <EffectBoundary>
              <Threads
                color={theme === "dark" ? "#91B4FF" : "#2454D6"}
                accentColor={theme === "dark" ? "#C2A1FF" : "#8A6ADF"}
                amplitude={1.35}
                distance={0.35}
                lineCount={64}
                thickness={0.85}
                softness={1.2}
                speed={0.4}
                angle={10}
                brightness={1.3}
                enableMouseInteraction
                parting={0.2}
                paused={!visible || policy.hidden}
                onReady={onReady}
                onFailure={onFailure}
              />
            </EffectBoundary>
          </div>
        )}
      </div>
      <small>Java　 Kafka　 PostgreSQL</small>
    </div>
  );
}

export function PublicCursor({ policy, overlay }) {
  const { theme } = useAppearance();
  const [failed, setFailed] = useState(false);
  const head = useRef(null);
  const fail = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const move = (event) => {
      if (!head.current) return;
      head.current.style.left = `${event.clientX}px`;
      head.current.style.top = `${event.clientY}px`;
      head.current.style.visibility = "visible";
    };
    const hide = () => {
      if (head.current) head.current.style.visibility = "hidden";
    };
    const keyboard = (event) => {
      if (event.key === "Tab") hide();
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    document.addEventListener("keydown", keyboard);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", hide);
      document.removeEventListener("keydown", keyboard);
    };
  }, []);
  if (!policy.fine || !policy.supported || failed) return null;
  const enabled = !policy.hidden && !overlay;
  return createPortal(
    <div
      className="pf-cursor-layer"
      aria-hidden="true"
      data-enabled={enabled}
      style={{ color: theme === "dark" ? "#A9BCFF" : "#2454D6" }}
    >
      <EffectBoundary>
        <GlowCursor
          color={theme === "dark" ? "#9BB5FF" : "#2454D6"}
          secondaryColor={theme === "dark" ? "#B29AFF" : "#8A6ADF"}
          theme={theme}
          intensity={theme === "dark" ? 0.9 : 0.65}
          trailWidth={1.8}
          linger={0.26}
          glow={0.7}
          hotspot={0.12}
          followSpeed={0.85}
          grain={0}
          clickBurst={false}
          quality="low"
          maxDevicePixelRatio={1}
          enabled={enabled}
          onFailure={fail}
        />
      </EffectBoundary>
      <span ref={head} className="pf-cursor-head" />
    </div>,
    document.body,
  );
}
// ScrollExpand adaptation: the existing hero is the track. No sticky stage or added height.
export function BoundedCode({ children, enabled }) {
  const frame = useRef(null);
  useEffect(() => {
    const el = frame.current;
    if (!enabled) {
      el.style.removeProperty("--pf-progress");
      return;
    }
    let raf = 0;
    let progress = 0;
    let target = 0;
    let last = 0;
    const tick = (now) => {
      if (document.hidden) {
        raf = 0;
        return;
      }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      progress += (target - progress) * (1 - Math.exp(-dt / 0.08));
      const ease = progress * progress * (3 - 2 * progress);
      el.style.setProperty("--pf-progress", ease);
      raf =
        Math.abs(progress - target) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const update = () => {
      target = Math.min(
        1,
        Math.max(0, -el.closest("section").getBoundingClientRect().top / 160),
      );
      if (!raf && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    document.addEventListener("visibilitychange", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [enabled]);
  return (
    <div ref={frame} className="pf-code-bound" data-no-glow>
      {children}
    </div>
  );
}
