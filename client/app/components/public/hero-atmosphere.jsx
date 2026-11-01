"use client";

import { useEffect, useId, useRef } from "react";
import { gsap } from "gsap";

export default function HeroAtmosphere({ enabled }) {
  const host = useRef(null);
  const gradient = useId().replace(/:/g, "");

  useEffect(() => {
    if (!enabled) return;
    const element = host.current;
    const media = gsap.matchMedia();
    media.add({ motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 900px)" }, ({ conditions }) => {
      if (!conditions.motion) return;
      let visible = false;
      const drift = gsap.timeline({ paused: true, repeat: -1, yoyo: true });
      drift.to(element.querySelector("svg"), { xPercent: 3, yPercent: -3, rotation: 3, duration: 16, ease: "sine.inOut" }, 0);
      if (conditions.desktop) drift.to(element.querySelector(".pf-hero-bloom--one"), { x: -45, y: 35, duration: 16, ease: "sine.inOut" }, 0);
      const update = () => drift.paused(!visible || document.hidden);
      const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
      observer.observe(element.closest("section"));
      document.addEventListener("visibilitychange", update);
      return () => {
        observer.disconnect();
        document.removeEventListener("visibilitychange", update);
      };
    }, host);
    return () => media.revert();
  }, [enabled]);

  return (
    <div ref={host} className="pf-hero-atmosphere" aria-hidden="true">
      <div className="pf-hero-bloom pf-hero-bloom--one" />
      <div className="pf-hero-bloom pf-hero-bloom--two" />
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none">
        <defs>
          <linearGradient id={gradient} x1="350" y1="900" x2="1250" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--pf-lilac)" stopOpacity="0.02" />
            <stop offset="0.5" stopColor="var(--pf-accent)" stopOpacity="0.15" />
            <stop offset="1" stopColor="var(--pf-lilac)" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path d="M300 1050C400 580 800 990 940 520S1080 -90 1560 100" stroke={`url(#${gradient})`} strokeWidth="180" />
        <path d="M320 1060C440 540 830 1000 965 510S1110 -100 1580 80" stroke="var(--pf-accent)" strokeOpacity="0.18" />
        <path d="M140 1000C320 450 710 900 880 440S1160 -180 1600 30" stroke="var(--pf-lilac)" strokeOpacity="0.14" />
        <path d="M440 1100C480 620 950 1010 1070 560S1180 30 1590 180" stroke="var(--pf-accent)" strokeOpacity="0.12" />
      </svg>
    </div>
  );
}
