"use client";

import React from "react";

function SectionVisualFrame({
  id,
  variant = "hero",
  accent = "emerald", // "cyan", "amber", "emerald", "gold"
  className = "",
  children,
  sectionTitle = "",
  sectionIndex = "",
  ...props
}) {
  // Map accents to styling classes
  const accentGlows = {
    cyan: "bg-[#64d8ff]/5 shadow-[#64d8ff]/5",
    amber: "bg-[#F59E0B]/5 shadow-[#F59E0B]/5",
    emerald: "bg-[#22C55E]/5 shadow-[#22C55E]/5",
    gold: "bg-[#D4AF37]/5 shadow-[#D4AF37]/5",
  };

  const accentBadges = {
    cyan: "bg-[#64d8ff]",
    amber: "bg-[#F59E0B]",
    emerald: "bg-[#22C55E]",
    gold: "bg-[#D4AF37]",
  };

  const currentGlow = accentGlows[accent] || accentGlows.gold;
  const currentBadge = accentBadges[accent] || accentBadges.gold;

  return (
    <section
      id={id}
      className={`relative z-10 w-full max-w-[92rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 my-8 rounded-2xl border border-zinc-900 bg-black/10 backdrop-blur-[2px] group/section ${className}`}
      {...props}
    >
      {/* Subtle Ambient Glow Blob in background */}
      <div 
        aria-hidden="true"
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(80vw,500px)] h-[min(80vw,500px)] rounded-full blur-[120px] pointer-events-none opacity-40 transition-all duration-700 group-hover/section:opacity-60 mix-blend-screen -z-10 ${currentGlow}`} 
      />

      {/* Technical Metadata Header */}
      {sectionTitle && (
        <div className="absolute top-3 left-4 right-4 flex justify-between items-center pointer-events-none select-none font-mono text-[9px] tracking-[0.2em] text-zinc-500 uppercase z-20">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${currentBadge}`} />
            <span>SYS_SEC // {sectionIndex} // {sectionTitle}</span>
          </div>
          <div className="hidden sm:block">ACCENT_{accent.toUpperCase()} // READY</div>
        </div>
      )}

      {/* L-bracket Corner Decorations */}
      <span className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-zinc-800 transition-colors duration-500 group-hover/section:border-[#D4AF37]/50" />
      <span className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-zinc-800 transition-colors duration-500 group-hover/section:border-[#D4AF37]/50" />
      <span className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-zinc-800 transition-colors duration-500 group-hover/section:border-[#D4AF37]/50" />
      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-zinc-800 transition-colors duration-500 group-hover/section:border-[#D4AF37]/50" />

      {/* Content wrapper */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </section>
  );
}

export default SectionVisualFrame;
