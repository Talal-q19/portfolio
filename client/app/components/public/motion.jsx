"use client";

import { Component, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useAppearance } from "./appearance";
import { motionPolicy } from "@/utils/motion-policy.mjs";

const CrystalizedBall = dynamic(() => import("./effects/CrystalizedBall"), {
  ssr: false,
});
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
    let slow =
      simple ||
      (navigator.hardwareConcurrency || 4) < 4 ||
      (navigator.deviceMemory && navigator.deviceMemory < 4) ||
      navigator.connection?.saveData;
    const update = () =>
      setPolicy(
        motionPolicy({
          desktop: desktop.matches,
          reduced: reduced.matches,
          fine: fine.matches,
          hidden: document.hidden,
          webgl: capable,
          simple,
          slow,
        }),
      );
    update();
    for (const q of [desktop, reduced, fine])
      q.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    // Measure sustained frame pressure, not one slow startup frame. Never re-enable automatically.
    let raf;
    let previous = 0;
    let frames = 0;
    let late = 0;
    const sample = (now) => {
      if (!document.hidden && previous && now - previous > 45) late++;
      previous = document.hidden ? 0 : now;
      if (++frames >= 180) {
        if (late > 45) {
          slow = true;
          update();
        }
        return;
      }
      raf = requestAnimationFrame(sample);
    };
    raf = requestAnimationFrame(sample);
    return () => {
      cancelAnimationFrame(raf);
      for (const q of [desktop, reduced, fine])
        q.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [simple]);
  return policy;
}

export function ContactCrystal({ policy, onVisibility }) {
  const { theme } = useAppearance();
  const host = useRef(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = host.current;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      onVisibility(entry.isIntersecting);
    });
    observer.observe(el);
    const lose = () => setFailed(true);
    el.addEventListener("webglcontextlost", lose, true);
    return () => {
      observer.disconnect();
      el.removeEventListener("webglcontextlost", lose, true);
      onVisibility(false);
    };
  }, [onVisibility]);
  return (
    <div ref={host} className="pf-crystal" aria-hidden="true">
      <div className="pf-crystal-static" />
      {policy.desktop && policy.gpu && !policy.hidden && visible && !failed && (
        <EffectBoundary>
          <CrystalizedBall
            preset="frost"
            theme={theme}
            color={theme === "dark" ? "#9BB5FF" : "#2454D6"}
            size={0.95}
            strands={2}
            crackle={0.15}
            flares={0.08}
            glow={0.22}
            sparks={0.06}
            particleCount={1200}
            fill={0.45}
            motion="drift"
            particleShape="round"
            depth={0.4}
            sway={0.12}
            twinkle={0.08}
            haze={0.12}
            speed={0.35}
            dustSpeed={0.25}
            interactive={false}
            hoverStrength={0}
            intro={false}
            paused={!visible || policy.hidden}
            onFailure={() => setFailed(true)}
          />
        </EffectBoundary>
      )}
    </div>
  );
}

export function PublicCursor({ policy, crystalVisible, overlay }) {
  const { theme } = useAppearance();
  const [suppressed, setSuppressed] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const update = (e) =>
      setSuppressed(
        !!e.target.closest?.(
          "form,input,textarea,select,button,a,img,dialog,[data-no-glow]",
        ) || document.activeElement?.matches(":focus-visible"),
      );
    const focus = () => setSuppressed(true);
    const modalChange = () =>
      setSuppressed(
        !!document.querySelector("dialog[open]") ||
          document.activeElement?.matches(":focus-visible"),
      );
    const observer = new MutationObserver(modalChange);
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    document.addEventListener("pointerover", update);
    document.addEventListener("focusin", focus);
    return () => {
      observer.disconnect();
      document.removeEventListener("pointerover", update);
      document.removeEventListener("focusin", focus);
    };
  }, []);
  if (
    !policy.fine ||
    !policy.gpu ||
    policy.hidden ||
    crystalVisible ||
    overlay ||
    suppressed ||
    failed
  )
    return null;
  return (
    <div className="pf-cursor" aria-hidden="true">
      <EffectBoundary>
        <GlowCursor
          color={theme === "dark" ? "#9BB5FF" : "#2454D6"}
          secondaryColor={theme === "dark" ? "#B29AFF" : "#8A6ADF"}
          theme={theme}
          intensity={theme === "dark" ? 0.18 : 0.12}
          trailWidth={1}
          linger={0.18}
          glow={0.15}
          hotspot={0}
          followSpeed={0.8}
          grain={0}
          clickBurst={false}
          quality="low"
          maxDevicePixelRatio={1}
          enabled
          onFailure={() => setFailed(true)}
        />
      </EffectBoundary>
    </div>
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
