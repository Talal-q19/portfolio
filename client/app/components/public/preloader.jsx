"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import RefineFrame from "./effects/RefineFrame";

export default function Preloader({ status, profile, onReveal, onComplete }) {
  const started = useRef(null);
  const [stage, setStage] = useState("generating");
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    started.current ??= performance.now();
    if (status !== "ready") return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wait = reduced
      ? 0
      : Math.max(0, 950 - (performance.now() - started.current));
    const timers = [
      setTimeout(() => setStage("refining"), wait),
      setTimeout(() => setStage("complete"), wait + (reduced ? 0 : 350)),
      setTimeout(() => setLeaving(true), wait + (reduced ? 0 : 800)),
    ];
    return () => timers.forEach(clearTimeout);
  }, [status]);
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-portfolio-loading", "");
    return () => root.removeAttribute("data-portfolio-loading");
  }, []);
  useEffect(() => {
    if (!leaving) return;
    onReveal();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(onComplete, reduced ? 50 : 450);
    return () => clearTimeout(timer);
  }, [leaving, onReveal, onComplete]);
  return (
    <div
      className="pf-preloader"
      data-leaving={leaving}
      aria-label="Loading portfolio"
    >
      <p className="pf-eyebrow">TQ / Talal Qasim</p>
      <RefineFrame
        status={stage}
        width={208}
        aspectRatio="1 / 1"
        radius={28}
        stageDuration={65}
        background="var(--pf-tint)"
        color="var(--pf-accent)"
        hideAfter={0}
        labels={{
          generating: "Loading portfolio",
          refining: "Almost ready",
          complete: "Welcome",
        }}
      >
        <Image
          src={profile || "/profilePic.jpeg"}
          alt="Talal Qasim"
          width={208}
          height={208}
          priority
        />
      </RefineFrame>
      <p>Engineering thoughtful digital experiences.</p>
    </div>
  );
}
