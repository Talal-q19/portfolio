"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

const smoothSpring = {
  stiffness: 85,
  damping: 22,
  mass: 0.5,
  restDelta: 0.001,
};

/* =========================================================================
   1. HERO SECTION: 3D Depth Recede & Z-Space Shrink
   ========================================================================= */
export function HeroBigTransition({ children }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Big dramatic shrink into deep Z-space with perspective pitch & blur
  const rawScale = useTransform(scrollYProgress, [0, 0.65, 1], [1, 0.90, 0.76]);
  const rawOpacity = useTransform(scrollYProgress, [0, 0.55, 1], [1, 0.8, 0.15]);
  const rawY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const rawRotateX = useTransform(scrollYProgress, [0, 1], [0, 12]);
  const rawBlur = useTransform(scrollYProgress, [0, 0.6, 1], [0, 2, 10]);

  const scale = useSpring(rawScale, smoothSpring);
  const opacity = useSpring(rawOpacity, smoothSpring);
  const y = useSpring(rawY, smoothSpring);
  const rotateX = useSpring(rawRotateX, smoothSpring);
  const blurValue = useSpring(rawBlur, smoothSpring);

  const filter = useTransform(blurValue, (v) => `blur(${v}px)`);

  return (
    <div ref={ref} className="relative w-full overflow-visible" style={{ perspective: 1200 }}>
      <motion.div
        style={{
          scale,
          opacity,
          y,
          rotateX,
          filter,
          transformOrigin: "center top",
          willChange: "transform, opacity, filter",
        }}
        className="w-full"
      >
        {children}
      </motion.div>

      {/* Luminous Event-Horizon Flare at Base */}
      <motion.div
        style={{
          opacity: useTransform(scrollYProgress, [0.3, 0.8, 1], [0, 0.9, 0]),
          scaleX: useTransform(scrollYProgress, [0.3, 0.9], [0.2, 1.2]),
        }}
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#64d8ff] to-transparent shadow-[0_0_30px_rgba(100,216,255,0.9)]"
      />
    </div>
  );
}

/* =========================================================================
   2. EXPERIENCE SECTION: Horizontal Parallax 3D Flip & Slide
   ========================================================================= */
export function ExperienceBigTransition({ children }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Entrance: Slides in from left with 3D Y-axis tilt
  const rawScale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.82, 1, 1, 0.85]);
  const rawOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.2, 1, 1, 0.2]);
  const rawX = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [-120, 0, 0, 100]);
  const rawY = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [100, 0, 0, -100]);
  const rawRotateY = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [-8, 0, 0, 8]);
  const rawRotateX = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [6, 0, 0, -6]);

  const scale = useSpring(rawScale, smoothSpring);
  const opacity = useSpring(rawOpacity, smoothSpring);
  const x = useSpring(rawX, smoothSpring);
  const y = useSpring(rawY, smoothSpring);
  const rotateY = useSpring(rawRotateY, smoothSpring);
  const rotateX = useSpring(rawRotateX, smoothSpring);

  return (
    <div ref={ref} className="relative w-full overflow-visible" style={{ perspective: 1400 }}>
      {/* Ambient Cyber Neon Aura */}
      <motion.div
        style={{
          opacity: useTransform(scrollYProgress, [0.1, 0.3, 0.7, 0.9], [0, 0.35, 0.35, 0]),
          scale: useTransform(scrollYProgress, [0, 0.3], [0.7, 1.15]),
        }}
        className="pointer-events-none absolute -inset-8 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.15)_0%,transparent_70%)] blur-3xl"
      />

      <motion.div
        style={{
          scale,
          opacity,
          x,
          y,
          rotateY,
          rotateX,
          transformOrigin: "center center",
          willChange: "transform, opacity",
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

/* =========================================================================
   3. SKILLS SECTION: Radial Center Explosion & Lens Flare Compression
   ========================================================================= */
export function SkillsBigTransition({ children }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Entrance: Explodes outward radially from center with slight twist
  const rawScale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.75, 1, 1, 0.82]);
  const rawOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.15, 1, 1, 0.2]);
  const rawRotate = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [-3, 0, 0, 3]);
  const rawY = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [140, 0, 0, -120]);

  const scale = useSpring(rawScale, smoothSpring);
  const opacity = useSpring(rawOpacity, smoothSpring);
  const rotate = useSpring(rawRotate, smoothSpring);
  const y = useSpring(rawY, smoothSpring);

  return (
    <div ref={ref} className="relative w-full overflow-visible" style={{ perspective: 1200 }}>
      {/* Central Flare Burst on Entry */}
      <motion.div
        style={{
          opacity: useTransform(scrollYProgress, [0.05, 0.25, 0.75, 0.95], [0, 0.7, 0.7, 0]),
          scale: useTransform(scrollYProgress, [0, 0.3], [0.4, 1.4]),
        }}
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(100,216,255,0.18)_0%,rgba(52,211,153,0.08)_40%,transparent_70%)] blur-2xl"
      />

      <motion.div
        style={{
          scale,
          opacity,
          rotate,
          y,
          transformOrigin: "center center",
          willChange: "transform, opacity",
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

/* =========================================================================
   4. PROJECTS SECTION: Cinematic 3D Deck Perspective Pitch & Fly-In
   ========================================================================= */
export function ProjectsBigTransition({ children }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Entrance: Steep 3D tilt pitch rising like a giant stage deck
  const rawScale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.78, 1, 1, 0.84]);
  const rawOpacity = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0.2, 1, 1, 0.25]);
  const rawY = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [180, 0, 0, -130]);
  const rawRotateX = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [14, 0, 0, -10]);

  const scale = useSpring(rawScale, smoothSpring);
  const opacity = useSpring(rawOpacity, smoothSpring);
  const y = useSpring(rawY, smoothSpring);
  const rotateX = useSpring(rawRotateX, smoothSpring);

  return (
    <div ref={ref} className="relative w-full overflow-visible" style={{ perspective: 1500 }}>
      {/* 3D Stage Lighting Sweep */}
      <motion.div
        style={{
          opacity: useTransform(scrollYProgress, [0.1, 0.3, 0.7, 0.9], [0, 0.45, 0.45, 0]),
        }}
        className="pointer-events-none absolute -inset-10 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(100,216,255,0.12)_0%,transparent_75%)] blur-2xl"
      />

      <motion.div
        style={{
          scale,
          opacity,
          y,
          rotateX,
          transformOrigin: "center top",
          willChange: "transform, opacity",
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

/* =========================================================================
   5. EDUCATION SECTION: Diagonal 3D Skew & Shear Unfold
   ========================================================================= */
export function EducationBigTransition({ children }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Entrance: Diagonal 3D shear & skew unfold with warm gold aura
  const rawScale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.80, 1, 1, 0.82]);
  const rawOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.2, 1, 1, 0.2]);
  const rawSkewY = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [3, 0, 0, -3]);
  const rawY = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [150, 0, 0, -110]);
  const rawRotateX = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [-8, 0, 0, 8]);

  const scale = useSpring(rawScale, smoothSpring);
  const opacity = useSpring(rawOpacity, smoothSpring);
  const skewY = useSpring(rawSkewY, smoothSpring);
  const y = useSpring(rawY, smoothSpring);
  const rotateX = useSpring(rawRotateX, smoothSpring);

  return (
    <div ref={ref} className="relative w-full overflow-visible" style={{ perspective: 1300 }}>
      {/* Amber Horizon Atmosphere */}
      <motion.div
        style={{
          opacity: useTransform(scrollYProgress, [0.1, 0.3, 0.7, 0.9], [0, 0.35, 0.35, 0]),
        }}
        className="pointer-events-none absolute -inset-8 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.12)_0%,transparent_70%)] blur-3xl"
      />

      <motion.div
        style={{
          scale,
          opacity,
          skewY,
          y,
          rotateX,
          transformOrigin: "center center",
          willChange: "transform, opacity",
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

/* =========================================================================
   6. CONTACT SECTION: Cosmic Gravitational Warp & Radar Burst
   ========================================================================= */
export function ContactBigTransition({ children }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });

  // Entrance: Gravitational warp rising up and exploding outward
  const rawScale = useTransform(scrollYProgress, [0, 0.35, 1], [0.76, 1, 1]);
  const rawOpacity = useTransform(scrollYProgress, [0, 0.3, 1], [0.15, 1, 1]);
  const rawY = useTransform(scrollYProgress, [0, 0.35, 1], [180, 0, 0]);
  const rawRotateX = useTransform(scrollYProgress, [0, 0.35, 1], [-12, 0, 0]);

  const scale = useSpring(rawScale, smoothSpring);
  const opacity = useSpring(rawOpacity, smoothSpring);
  const y = useSpring(rawY, smoothSpring);
  const rotateX = useSpring(rawRotateX, smoothSpring);

  return (
    <div ref={ref} className="relative w-full overflow-visible" style={{ perspective: 1400 }}>
      {/* Radiant Emerald Cosmic Gravitational Aura */}
      <motion.div
        style={{
          opacity: useTransform(scrollYProgress, [0.1, 0.5], [0, 0.6]),
          scale: useTransform(scrollYProgress, [0, 0.7], [0.5, 1.4]),
        }}
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.25)_0%,rgba(100,216,255,0.1)_45%,transparent_70%)] blur-3xl"
      />

      <motion.div
        style={{
          scale,
          opacity,
          y,
          rotateX,
          transformOrigin: "center center",
          willChange: "transform, opacity",
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
