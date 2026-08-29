'use client';

import Image from 'next/image';
import * as React from 'react';
import { FiMaximize2, FiMinus, FiX, FiGithub, FiExternalLink } from 'react-icons/fi';
import { skillsImage } from '@/utils/skill-image';

const projectImages = {
  attendance: ['/project-images/federal-dashboard.png'],
  streaming: ['/project-images/stream-hub.png'],
  dataVisualization: ['/project-images/data-visualization.png'],
};

const genericToolBadge =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' x2='100%25' y1='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23E2E8F0'/%3E%3Cstop offset='100%25' stop-color='%2394A3B8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='32' cy='32' r='30' fill='none' stroke='url(%23g)' stroke-width='5'/%3E%3Ccircle cx='32' cy='32' r='12' fill='url(%23g)' fill-opacity='.88'/%3E%3Cpath d='M20 32h8M36 32h8M32 20v8M32 36v8' stroke='%23fff' stroke-opacity='.85' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E";

function WindowControl({ label, color, children, onClick, pressed }) {
  const fallbackIcon = label.startsWith('Expand') ? <FiMaximize2 size={8} /> : null;

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={`group flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-extrabold leading-none transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-1 focus:ring-white/40 lg:h-4 lg:w-4 lg:text-[9px] ${color}`}
    >
      <span className="translate-y-[-0.2px] opacity-25 transition-opacity duration-200 group-hover:opacity-100">
        {children || fallbackIcon}
      </span>
    </button>
  );
}

function ProjectCard({ project, isExpanded, isMinimized, onClose, onExpand, onMinimize }) {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const slides = React.useMemo(() => {
    if (project.images?.length) {
      return project.images;
    }

    if (project.image) {
      return [project.image];
    }

    return projectImages[project.imageKey] || [];
  }, [project.image, project.imageKey, project.images]);
  const previewImage = slides[currentSlide];
  const details = project.details?.length ? project.details : [project.description];

  const touchStartX = React.useRef(null);
  const touchEndX = React.useRef(null);
  const minSwipeDistance = 40;

  const onTouchStart = (e) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setCurrentSlide((slide) => (slide + 1) % slides.length);
    }
    if (isRightSwipe) {
      setCurrentSlide((slide) => (slide === 0 ? slides.length - 1 : slide - 1));
    }
  };

  React.useEffect(() => {
    setCurrentSlide(0);
  }, [isExpanded, project.id]);

  React.useEffect(() => {
    if (!isExpanded || isMinimized || slides.length < 2) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCurrentSlide((slide) => (slide + 1) % slides.length);
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, [isExpanded, isMinimized, slides.length]);

  return (
    <div data-expanded={isExpanded ? 'true' : 'false'} className={`window-card group/window w-full border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-[#E2E8F0]/40 transition-all duration-500 ease-out ${isExpanded ? '!shadow-[0_24px_80px_rgba(0,0,0,0.85)] !border-[#E2E8F0]/70' : ''}`}>
      <div className="window-header flex items-center justify-between px-3 py-2.5 lg:px-6 lg:py-3 relative z-20">
        <div className="flex flex-row items-center space-x-1.5 lg:space-x-2 shrink-0">
          <WindowControl label={`Close ${project.name} preview`} color="bg-[#FF5F56] text-[#4C0002]" onClick={onClose} pressed={false}>
            <FiX size={8} />
          </WindowControl>
          <WindowControl label={`Minimize ${project.name}`} color="bg-[#FFBD2E] text-[#5C3E00]" onClick={onMinimize} pressed={isMinimized}>
            <FiMinus size={8} />
          </WindowControl>
          <WindowControl label={`Expand ${project.name}`} color="bg-[#27C93F] text-[#004D0B]" onClick={onExpand} pressed={isExpanded} />
        </div>
        <div className="flex-1 flex items-center justify-center gap-1.5 px-3 min-w-0">
          <span className="status-dot active shrink-0" title={project.status || 'Active'} />
          <p className="truncate text-center text-xs sm:text-sm font-semibold tracking-wide text-slate-300 transition-colors duration-300 group-hover/window:text-[#E2E8F0] lg:text-base">
            {project.name}
          </p>
        </div>
        {/* Balanced spacer so text is centered and doesn't overlap */}
        <div className="w-12 lg:w-16 shrink-0 pointer-events-none" aria-hidden="true" />
      </div>

      <div className={`window-body relative z-10 grid border-t border-[#262626]/40 transition-[grid-template-rows,opacity] duration-500 ease-out ${isMinimized ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
        <div className="overflow-hidden">
          <div className="px-4 py-3 lg:px-6 lg:py-5 bg-[#080d16]/30">
            <code className="font-mono text-[11px] md:text-xs lg:text-[13px] leading-relaxed">
              <div className="flex items-center">
                <span className="mr-2 text-[#C792EA] italic">const</span>
                <span className="mr-2 text-[#82AAFF]">project</span>
                <span className="mr-2 text-[#C792EA]">=</span>
                <span className="text-[#89DDFF]">{'{'}</span>
              </div>
              <div className="pl-4 md:pl-8 border-l border-white/5 my-1 flex flex-col gap-1">
                <div>
                  <span className="text-[#EEFFFF] mr-1.5">name:</span>
                  <span className="text-[#89DDFF]">{`'`}</span>
                  <span className="text-[#C3E88D]">{project.name}</span>
                  <span className="text-[#89DDFF]">{`',`}</span>
                </div>

                {project.status && (
                  <div>
                    <span className="text-[#EEFFFF] mr-1.5">status:</span>
                    <span className="text-[#89DDFF]">{`'`}</span>
                    <span className="text-[#F78C6C] font-medium">{project.status}</span>
                    <span className="text-[#89DDFF]">{`',`}</span>
                  </div>
                )}

                <div>
                  <span className="text-[#EEFFFF] mr-1.5">techStack:</span>
                  <span className="text-[#89DDFF]">{`[`}</span>
                  {(project.techStack || project.tools || []).map((tag, i, arr) => (
                    <React.Fragment key={i}>
                      <span className="text-[#89DDFF]">{`'`}</span>
                      <span className="text-[#C3E88D]">{tag}</span>
                      <span className="text-[#89DDFF]">{`'`}</span>
                      {arr.length - 1 !== i && (
                        <span className="text-slate-500 mr-1.5">,</span>
                      )}
                    </React.Fragment>
                  ))}
                  <span className="text-[#89DDFF]">{`],`}</span>
                </div>
                <div>
                  <span className="text-[#EEFFFF] mr-1.5">myRole:</span>
                  <span className="text-[#89DDFF]">{`'`}</span>
                  <span className="text-[#F78C6C]">{project.role}</span>
                  <span className="text-[#89DDFF]">{`',`}</span>
                </div>
                <div className="flex items-start flex-wrap">
                  <span className="text-[#EEFFFF] mr-1.5 shrink-0">description:</span>
                  <span className="text-[#89DDFF] shrink-0">{`'`}</span>
                  <span className="text-[#80CBA6]">{project.description}</span>
                  <span className="text-[#89DDFF]">{`',`}</span>
                </div>
              </div>
              <div><span className="text-[#89DDFF]">{`};`}</span></div>
            </code>
          </div>

          <div className={`grid transition-[grid-template-rows,opacity,transform] duration-500 ease-out ${isExpanded ? 'grid-rows-[1fr] translate-y-0 opacity-100' : 'grid-rows-[0fr] -translate-y-3 opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="mx-3 mb-3 overflow-hidden rounded-lg border border-white/5 bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] lg:mx-4 lg:mb-4">
                <div className="grid grid-cols-1 gap-4 p-3 md:grid-cols-2 lg:p-5 lg:gap-6">
                  <div className="flex flex-col gap-2">
                    {project.status && (
                      <div className="md:hidden flex justify-start">
                        <span className="rounded-full border border-[#34D399]/45 bg-[#07101d]/90 px-3 py-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#34D399]">
                          {project.status}
                        </span>
                      </div>
                    )}
                    <div 
                      className="project-media-reveal relative aspect-video w-full overflow-hidden rounded-md border border-white/10 bg-[#06091d] flex items-center justify-center cursor-ew-resize sm:cursor-default"
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                    >
                      <div className="project-window-scan absolute inset-0 z-10 pointer-events-none"></div>
                      {previewImage && (
                        <Image
                          key={`${project.id}-${currentSlide}`}
                          src={previewImage}
                          alt={`${project.name} preview ${currentSlide + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 58vw"
                          className={`project-slide-image w-full h-full ${project.imageKind === 'logo' ? 'project-logo-float object-contain p-10 sm:p-14' : 'object-cover object-center'} transition-transform duration-700 ease-out ${isExpanded ? 'scale-100' : 'scale-95'}`}
                          priority={project.id === 1}
                        />
                      )}
                      {slides.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-full border border-white/10 bg-[#050816]/80 px-2 py-1 backdrop-blur">
                          {slides.map((slide, index) => (
                            <button
                              key={slide}
                              type="button"
                              aria-label={`Show ${project.name} image ${index + 1}`}
                              onClick={() => setCurrentSlide(index)}
                              className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === index ? 'w-5 bg-[#E2E8F0]' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                            />
                          ))}
                        </div>
                      )}
                      {project.status && (
                        <span className="hidden md:inline-block absolute left-3 top-3 z-20 rounded-full border border-[#34D399]/45 bg-[#07101d]/90 px-3 py-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#34D399]">
                          {project.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-4 md:aspect-video overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#34D399]">
                        Project Notes
                      </p>
                      <h3 className="text-lg font-semibold leading-tight text-white md:text-xl lg:text-2xl">
                        {project.name}
                      </h3>
                      <p className="text-xs leading-5 text-slate-300 md:text-sm md:leading-6">
                        {project.description}
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs leading-5 text-slate-200 md:text-sm md:leading-6">
                      {details.map((detail, index) => (
                        <li key={index} className="flex gap-2.5 items-start">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#34D399]"></span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Links (Demo / Source) */}
                    <div className="flex flex-wrap gap-2.5 my-1">
                      {project.demo ? (
                        <a
                          href={project.demo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-white via-[#E2E8F0] to-[#CBD5E1] px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-[#050505] shadow-[0_0_20px_rgba(241,245,249,0.15)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] focus:outline-none focus:ring-1 focus:ring-[#E2E8F0]/50 cursor-pointer"
                        >
                          <FiExternalLink size={13} />
                          <span>Live Demo</span>
                        </a>
                      ) : null}
                      {project.code ? (
                        <a
                          href={project.code}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-[#262626] bg-[#151515] px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-[#EFF3F4] shadow-md transition-all duration-300 hover:scale-105 hover:border-[#E2E8F0]/40 hover:bg-[#E2E8F0]/10 focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer"
                        >
                          <FiGithub size={13} />
                          <span>View Source</span>
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-lg border border-white/5 bg-[#10131b]/60 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 shadow-sm">
                          <FiGithub size={13} className="opacity-60" />
                          <span>Private Repository</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                      {(project.techStack || project.tools || []).slice(0, 8).map((tool) => {
                        const toolIcon = skillsImage(tool);

                        return (
                          <span
                            key={tool}
                            title={tool}
                            aria-label={tool}
                            className="group inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-black/40 px-2 py-1 transition-transform duration-300 hover:scale-105 hover:border-white/20 hover:bg-white/5"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/50">
                              {toolIcon ? (
                                <Image
                                  src={toolIcon}
                                  alt={tool}
                                  width={14}
                                  height={14}
                                  className="h-3 w-3 object-contain"
                                />
                              ) : (
                                <Image
                                  src={genericToolBadge}
                                  alt={tool}
                                  width={14}
                                  height={14}
                                  className="h-3 w-3 object-contain"
                                />
                              )}
                            </span>
                            <span className="max-w-[6.5rem] truncate text-[9.5px] font-medium leading-none text-slate-300">
                              {tool}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMinimized && (
        <div className="border-t border-[#262626]/30 px-4 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 bg-[#0c1017]/40">
          Minimized
        </div>
      )}
    </div>
  );
}

export default ProjectCard;
