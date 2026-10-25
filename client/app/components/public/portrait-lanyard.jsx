"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { EffectBoundary } from "./motion";
import { useAppearance } from "./appearance";

const Lanyard = dynamic(() => import("./effects/Lanyard"), { ssr: false });

export default function PortraitLanyard({ src, name, policy }) {
  const { theme } = useAppearance();
  const host = useRef(null);
  const [primed, setPrimed] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => setPrimed(true), { timeout: 1500 })
      : window.setTimeout(() => setPrimed(true), 200);
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    observer.observe(host.current);
    return () => {
      observer.disconnect();
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
  return (
    <figure
      ref={host}
      className="pf-portrait-lanyard"
      data-ready={!!(enabled && ready)}
      aria-label={`${name}, ${enabled ? "interactive " : ""}portrait badge`}
    >
      <div className="pf-portrait-fallback">
        <span className="pf-portrait-strap" />
        <div className="pf-portrait-badge">
          {src && (
            <Image src={src} alt={name} width={200} height={260} priority />
          )}
        </div>
      </div>
      {enabled && primed && (
        <div ref={onMount} className="pf-effect-canvas">
          <EffectBoundary>
            <Lanyard
              frontImage={src}
              backImage={src}
              imageFit="cover"
              orientation="portrait"
              size={0.68}
              strapLength={0.3}
              finish="matte"
              strapColor={theme === "dark" ? "#8fafff" : "#2454d6"}
              cardColor={theme === "dark" ? "#18243b" : "#ffffff"}
              damping={0.8}
              breeze={0.05}
              intro={false}
              paused={!visible || policy.hidden}
              onReady={onReady}
              onFailure={onFailure}
            />
          </EffectBoundary>
        </div>
      )}
      <figcaption>
        {enabled && ready ? "Drag to move · Click to flip" : ""}
      </figcaption>
    </figure>
  );
}
