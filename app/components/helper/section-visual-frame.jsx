"use client";

import { useReducedMotion } from "@/app/hooks/use-reduced-motion";
import { useId } from "react";

const variantPaths = {
  hero: {
    viewBox: "0 0 760 430",
    nodes: [
      [110, 90], [280, 74], [432, 132], [610, 86],
      [170, 310], [360, 286], [590, 326],
    ],
    paths: [
      "M110 90 H280 L432 132 H610",
      "M170 310 H360 L432 132",
      "M360 286 H590 V326",
      "M280 74 V210 H528",
    ],
  },
  about: {
    viewBox: "0 0 640 360",
    nodes: [[96, 84], [280, 58], [512, 110], [156, 278], [430, 266]],
    paths: ["M96 84 H280 V58", "M280 58 L512 110", "M156 278 H430 V266", "M96 84 V278 H156"],
  },
  timeline: {
    viewBox: "0 0 620 520",
    nodes: [[98, 84], [98, 188], [98, 292], [98, 396], [402, 136], [500, 336]],
    paths: ["M98 56 V430", "M98 188 H402 V136", "M98 292 H500 V336"],
  },
  projects: {
    viewBox: "0 0 720 520",
    nodes: [[96, 102], [274, 102], [520, 156], [624, 314], [232, 414], [82, 330]],
    paths: ["M96 102 H274 L520 156", "M520 156 H624 V314", "M82 330 H232 V414 H520", "M274 102 V280 H624"],
  },
  contact: {
    viewBox: "0 0 600 420",
    nodes: [[300, 92], [454, 180], [408, 322], [192, 322], [146, 180], [300, 212]],
    paths: ["M300 92 L454 180 L408 322 L192 322 L146 180 Z", "M300 92 V212 L408 322", "M146 180 L300 212 H454"],
  },
};

const accentClasses = {
  emerald: "text-[#16f2b3]",
  pink: "text-pink-500",
  violet: "text-violet-500",
  amber: "text-amber-300",
  cyan: "text-cyan-300",
};

function SectionVisualFrame({
  variant = "hero",
  accent = "emerald",
  className = "",
  children,
  ...props
}) {
  const prefersReducedMotion = useReducedMotion();
  const instanceId = useId().replace(/:/g, "");
  const visual = variantPaths[variant] || variantPaths.hero;
  const accentClass = accentClasses[accent] || accentClasses.emerald;
  const nodeGradientId = `${variant}-${instanceId}-node-glow`;
  const lineGradientId = `${variant}-${instanceId}-line-flow`;

  return (
    <section
      className={`section-visual-frame section-visual-frame--${variant} ${accentClass} ${className}`}
      data-reduced-motion={prefersReducedMotion ? "true" : "false"}
      {...props}
    >
      <svg
        aria-hidden="true"
        className="section-visual-frame__svg pointer-events-none absolute inset-0 -z-10 h-full w-full"
        viewBox={visual.viewBox}
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id={nodeGradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
            <stop offset="55%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={lineGradientId} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="48%" stopColor="currentColor" stopOpacity="0.58" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="section-visual-frame__grid" opacity="0.16">
          <path d="M0 80 H760 M0 180 H760 M0 280 H760 M0 380 H760" />
          <path d="M80 0 V520 M200 0 V520 M320 0 V520 M440 0 V520 M560 0 V520 M680 0 V520" />
        </g>

        <g className="section-visual-frame__paths">
          {visual.paths.map((path) => (
            <path key={path} d={path} className="section-visual-frame__path" stroke={`url(#${lineGradientId})`} />
          ))}
        </g>

        <g className="section-visual-frame__nodes">
          {visual.nodes.map(([cx, cy], index) => (
            <g key={`${cx}-${cy}`}>
              <circle cx={cx} cy={cy} r="20" fill={`url(#${nodeGradientId})`} />
              <circle
                cx={cx}
                cy={cy}
                r={index === visual.nodes.length - 1 ? "4.5" : "3.5"}
                className="section-visual-frame__node"
              />
            </g>
          ))}
        </g>

        <g className="section-visual-frame__corners">
          <path d="M40 78 V40 H98" />
          <path d="M662 40 H720 V78" />
          <path d="M720 342 V382 H662" />
          <path d="M98 382 H40 V342" />
        </g>
      </svg>

      <div aria-hidden="true" className="section-visual-frame__scan pointer-events-none absolute inset-x-0 top-0 -z-10 h-px" />
      {children}
    </section>
  );
}

export default SectionVisualFrame;
