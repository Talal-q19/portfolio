"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import Image from "next/image";
import { EffectBoundary } from "./motion";
import { useAppearance } from "./appearance";

const Lanyard = dynamic(() => import("./effects/Lanyard"), { ssr: false });

export default function PortraitLanyard({ src, name, policy, entered = true }) {
  const { theme } = useAppearance();
  const host = useRef(null);
  const [primed, setPrimed] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [released, setReleased] = useState(false);
  useEffect(() => {
    if (!entered) return;
    const timer = window.setTimeout(() => setReleased(true), 100);
    return () => window.clearTimeout(timer);
  }, [entered]);
  useEffect(() => {
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => setPrimed(true), { timeout: 1500 })
      : window.setTimeout(() => setPrimed(true), 200);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => setFailed(true), []);
  const onMount = useCallback((element) => {
    if (element) setReady(false);
  }, []);
  const enabled = policy.desktop && policy.supported && !failed && src;
  const appeared = entered && released;
  const active = appeared && ready;
  return (
    <figure
      ref={host}
      className="pf-portrait-lanyard"
      data-ready={!!(enabled && active)}
      aria-label={`${name}, ${enabled ? "interactive " : ""}portrait badge`}
    >
      {!(enabled && active) && (
        <div className="pf-portrait-fallback">
          <span className="pf-portrait-strap" />
          <div className="pf-portrait-badge">
            {src && (
              <Image src={src} alt={name} width={200} height={260} priority />
            )}
          </div>
        </div>
      )}
      {enabled &&
        primed &&
        createPortal(
          <div ref={onMount} className="pf-lanyard-overlay" data-ready={active}>
            <EffectBoundary>
              <Lanyard
                frontImage={src}
                backText="Backend Engineer at EUNX"
                imageFit="cover"
                orientation="portrait"
                size={0.68}
                strapLength={0.3}
                finish="matte"
                strapColor={theme === "dark" ? "#8fafff" : "#2454d6"}
                cardColor={theme === "dark" ? "#18243b" : "#ffffff"}
                damping={0.6}
                elasticity={0.45}
                breeze={0}
                intro={active}
                anchorElement={host}
                maxStretch="hero"
                paused={policy.hidden || !active}
                onReady={onReady}
                onFailure={onFailure}
              />
            </EffectBoundary>
          </div>,
          document.body,
        )}
    </figure>
  );
}
