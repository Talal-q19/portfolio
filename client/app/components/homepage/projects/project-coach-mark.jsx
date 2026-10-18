"use client";

import { useEffect } from "react";
import { FiArrowUpRight, FiX } from "react-icons/fi";
import { useReducedMotion } from "@/app/hooks/use-reduced-motion";

function ProjectCoachMark({ onDismiss }) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  return (
    <div className={`project-coach-mark absolute left-0 top-full z-40 mt-3 w-[min(19rem,calc(100vw-3rem))] rounded-xl border border-[#64d8ff]/50 bg-[#07101d]/95 p-3.5 shadow-[0_18px_42px_rgba(0,0,0,0.62)] backdrop-blur-xl ${prefersReducedMotion ? "" : "animate-fadeIn"}`} role="dialog" aria-label="Project case study guide">
      <span aria-hidden="true" className="absolute -top-1.5 left-[5.35rem] h-3 w-3 rotate-45 border-l border-t border-[#64d8ff]/50 bg-[#07101d]" />
      <div className="relative flex gap-3">
        <span aria-hidden="true" className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#27C93F]/60 bg-[#27C93F]/10 text-[#65ee78] ${prefersReducedMotion ? "" : "project-coach-pulse"}`}><FiArrowUpRight size={15} /></span>
        <div className="min-w-0"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#64d8ff]">Explore the work</p><p className="mt-1 text-sm leading-5 text-slate-200">Click the green control to expand a project case study.</p></div>
        <button type="button" onClick={onDismiss} className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d8ff]" aria-label="Dismiss project guide" title="Dismiss guide"><FiX size={16} /></button>
      </div>
      <button type="button" onClick={onDismiss} className="relative mt-3 w-full rounded-md border border-[#64d8ff]/35 bg-[#64d8ff]/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#c6f1ff] transition-colors hover:bg-[#64d8ff]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d8ff]">Got it</button>
    </div>
  );
}

export default ProjectCoachMark;