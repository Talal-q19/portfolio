"use client";

import Image from "next/image";
import * as React from "react";
import { FiChevronLeft, FiChevronRight, FiGithub, FiMaximize2, FiMinus, FiX } from "react-icons/fi";
import { skillsImage } from "@/utils/skill-image";
import { useReducedMotion } from "@/app/hooks/use-reduced-motion";
import ProjectCoachMark from "./project-coach-mark";

const projectImages = {
  attendance: ["/project-images/federal-dashboard.png"],
  streaming: ["/project-images/stream-hub.png"],
  dataVisualization: ["/project-images/data-visualization.png"],
};

function WindowControl({ label, color, children, onClick, pressed }) {
  const fallbackIcon = label.startsWith("Expand") ? <FiMaximize2 size={9} /> : null;
  return (
    <button type="button" aria-label={label} aria-pressed={pressed} title={label} onClick={onClick} className="group/control -m-3 flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d8ff]">
      <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-extrabold leading-none shadow-[0_1px_3px_rgba(0,0,0,0.45)] transition-transform duration-200 group-hover/control:scale-110 ${color}`}>
        <span className="translate-y-[-0.2px] opacity-0 transition-opacity duration-150 group-hover/control:opacity-100 group-focus-visible/control:opacity-100">{children || fallbackIcon}</span>
      </span>
    </button>
  );
}

function StatusBadge({ project, compact = false }) {
  const styles = {
    "in-progress": "border-[#fbbf24]/45 bg-[#2a210c]/70 text-[#fcd34d]",
    completed: "border-[#34D399]/45 bg-[#07101d]/90 text-[#6ee7b7]",
    live: "border-[#64d8ff]/45 bg-[#07101d]/90 text-[#8be5ff]",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.62rem] font-bold uppercase tracking-[0.15em] ${styles[project.statusType] || styles.completed} ${compact ? "" : "sm:px-3"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{project.status || "Completed"}</span>;
}

function ProjectCard({ project, projectNumber, isExpanded, isMinimized, onClose, onExpand, onMinimize, showCoachMark, onDismissCoachMark }) {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const prefersReducedMotion = useReducedMotion();
  const slides = React.useMemo(() => project.images?.length ? project.images : project.image ? [project.image] : projectImages[project.imageKey] || [], [project.image, project.imageKey, project.images]);
  const details = project.details?.length ? project.details : [project.description];
  const touchStartX = React.useRef(null);
  const touchEndX = React.useRef(null);
  const previewImage = slides[currentSlide];
  const hasMultipleSlides = slides.length > 1;

  React.useEffect(() => setCurrentSlide(0), [isExpanded, project.id]);

  const goToSlide = (nextSlide) => {
    if (!slides.length) return;
    setCurrentSlide((nextSlide + slides.length) % slides.length);
  };
  const onTouchStart = (event) => { touchEndX.current = null; touchStartX.current = event.targetTouches[0].clientX; };
  const onTouchMove = (event) => { touchEndX.current = event.targetTouches[0].clientX; };
  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) >= 40) goToSlide(currentSlide + (distance > 0 ? 1 : -1));
  };

  return (
    <article data-expanded={isExpanded ? "true" : "false"} className={`window-card group/window w-full border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 ease-out ${isExpanded ? "!border-[#E2E8F0]/70 !shadow-[0_24px_80px_rgba(0,0,0,0.85)]" : "hover:border-[#E2E8F0]/40"}`}>
      <header className="window-header relative z-20 flex items-center justify-between gap-2 px-3 py-3 lg:px-6">
        <div className="relative flex shrink-0 items-center gap-1.5 lg:gap-2">
          <WindowControl label={`Close ${project.name} preview`} color="bg-[#FF5F56] text-[#4C0002]" onClick={onClose}><FiX size={8} /></WindowControl>
          <WindowControl label={`Minimize ${project.name}`} color="bg-[#FFBD2E] text-[#5C3E00]" onClick={onMinimize} pressed={isMinimized}><FiMinus size={8} /></WindowControl>
          <span className={showCoachMark && !prefersReducedMotion ? "project-expand-halo rounded-full" : ""}><WindowControl label={`${isExpanded ? "Collapse" : "Expand"} ${project.name} case study`} color="bg-[#27C93F] text-[#004D0B]" onClick={onExpand} pressed={isExpanded} /></span>
          {showCoachMark && <ProjectCoachMark onDismiss={onDismissCoachMark} />}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-2">
          <span className={`status-dot ${project.statusType === "in-progress" ? "progress" : project.statusType === "live" ? "live" : "active"} shrink-0`} aria-hidden="true" />
          <p className="truncate text-center text-xs font-semibold tracking-wide text-slate-200 lg:text-base">{project.name}</p>
        </div>
        <div className="w-11 shrink-0" aria-hidden="true" />
      </header>

      <div className={`window-body relative z-10 grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isMinimized ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}>
        <div className="overflow-hidden">
          <div className="bg-[#080d16]/30 px-4 py-4 lg:px-6 lg:py-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#64d8ff]">Case study {String(projectNumber).padStart(2, "0")}</p><p className="mt-1 text-sm font-medium text-slate-300">{project.role}</p></div>
              <StatusBadge project={project} compact />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div><h3 className="text-xl font-semibold leading-tight text-white md:text-2xl">{project.name}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{project.description}</p></div>
              <div className="rounded-lg border border-[#34D399]/25 bg-[#07101d]/70 px-3 py-2 md:max-w-[17rem]"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#6ee7b7]">Outcome</p><p className="mt-1 text-xs leading-5 text-slate-200">{project.outcome}</p></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/5 pt-3" aria-label={`${project.name} technologies`}>
              {(project.techStack || project.tools || []).slice(0, 7).map((tool) => <span key={tool} className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-[10px] text-slate-300">{tool}</span>)}
            </div>
          </div>

          <div className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out ${isExpanded ? "grid-rows-[1fr] translate-y-0 opacity-100" : "grid-rows-[0fr] -translate-y-2 opacity-0"}`}>
            <div className="overflow-hidden">
              <div className="mx-3 mb-3 overflow-hidden rounded-lg border border-white/10 bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] lg:mx-4 lg:mb-4">
                <div className="grid grid-cols-1 gap-5 p-3 md:grid-cols-2 lg:gap-6 lg:p-5">
                  <div className="flex flex-col gap-3">
                    <div className="project-media-reveal relative aspect-[2/1] w-full overflow-hidden rounded-md border border-white/10 bg-[#06091d]" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                      {previewImage ? <Image key={`${project.id}-${currentSlide}`} src={previewImage} alt={`${project.name} preview ${currentSlide + 1} of ${slides.length}`} fill sizes="(max-width: 768px) 100vw, 58vw" className={`h-full w-full ${project.imageKind === "logo" ? "project-logo-float object-contain p-10 sm:p-14" : "object-cover object-center"} transition-transform duration-500 ${isExpanded ? "scale-100" : "scale-95"}`} priority={project.id === 1} /> : <p className="flex h-full items-center justify-center text-sm text-slate-400">Preview unavailable</p>}
                      {hasMultipleSlides && <><button type="button" onClick={() => goToSlide(currentSlide - 1)} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d8ff]" aria-label={`Previous ${project.name} preview`}><FiChevronLeft size={20} /></button><button type="button" onClick={() => goToSlide(currentSlide + 1)} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d8ff]" aria-label={`Next ${project.name} preview`}><FiChevronRight size={20} /></button><span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/70 px-3 py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-white">{currentSlide + 1} / {slides.length}</span></>}
                      <span className="sr-only" aria-live="polite">Showing preview {currentSlide + 1} of {slides.length}</span>
                    </div>
                    {hasMultipleSlides && <div className="flex justify-center gap-2" aria-label="Choose project preview">{slides.map((slide, index) => <button key={slide} type="button" onClick={() => goToSlide(index)} aria-label={`Show ${project.name} image ${index + 1}`} aria-current={currentSlide === index} className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d8ff] ${currentSlide === index ? "w-6 bg-[#64d8ff]" : "w-2 bg-white/35 hover:bg-white/70"}`} />)}</div>}
                  </div>
                  <div className="flex flex-col justify-between gap-5 md:aspect-[2/1] md:overflow-y-auto md:pr-2 custom-scrollbar" tabIndex={0} aria-label={`${project.name} case study details`}>
                    <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#34D399]">Project notes</p><ul className="mt-3 space-y-2.5 text-sm leading-6 text-slate-200">{details.map((detail, index) => <li key={index} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#34D399]" /><span>{detail}</span></li>)}</ul></div>
                    <div className="flex flex-wrap gap-2.5 border-t border-white/5 pt-4">
                      {project.code ? <a href={project.code} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 bg-[#151515] px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:border-[#64d8ff]/50 hover:bg-[#64d8ff]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d8ff]"><FiGithub size={13} />View source</a> : <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-[#10131b]/70 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><FiGithub size={13} />Private repository</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isMinimized && <div className="flex items-center justify-between border-t border-[#262626]/30 bg-[#0c1017]/70 px-4 py-3"><span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Window minimized</span><button type="button" onClick={onMinimize} className="min-h-9 rounded-md border border-[#fbbf24]/40 bg-[#fbbf24]/10 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#fcd34d] transition-colors hover:bg-[#fbbf24]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbbf24]">Restore window</button></div>}
    </article>
  );
}

export default ProjectCard;