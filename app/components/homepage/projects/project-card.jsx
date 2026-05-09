'use client';

import Image from 'next/image';
import * as React from 'react';
import { FiMaximize2, FiMinus, FiX } from 'react-icons/fi';

const projectImages = {
  attendance: ['/project-images/federal-dashboard.png'],
  streaming: ['/project-images/stream-hub.png'],
  dataVisualization: ['/project-images/data-visualization.png'],
};

function WindowControl({ label, color, children, onClick, pressed }) {
  const fallbackIcon = label.startsWith('Expand') ? <FiMaximize2 size={9} /> : null;

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={`group flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold leading-none text-[#08101f]/80 shadow-[0_0_12px_rgba(255,255,255,0.18)] transition-all duration-300 hover:scale-125 hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-white/60 lg:h-4 lg:w-4 lg:text-[10px] ${color}`}
    >
      <span className="translate-y-[-0.5px] opacity-80 transition-opacity duration-200 group-hover:opacity-100">
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
    <div data-expanded={isExpanded ? 'true' : 'false'} className={`project-circuit-frame from-[#0d1224] border-[#1b2c68a0] relative w-full overflow-hidden rounded-lg border bg-gradient-to-r to-[#0a0d37] transition-all duration-500 ease-out ${isExpanded ? 'shadow-[0_24px_80px_rgba(22,242,179,0.16)]' : ''}`}>
      <div className="px-4 lg:px-8 py-3 lg:py-5 relative z-10">
        <div className="absolute top-1/2 flex -translate-y-1/2 flex-row items-center space-x-1.5 lg:space-x-2">
          <WindowControl label={`Close ${project.name} preview`} color="bg-red-400" onClick={onClose} pressed={false}>
            <FiX size={10} />
          </WindowControl>
          <WindowControl label={`Minimize ${project.name}`} color="bg-orange-400" onClick={onMinimize} pressed={isMinimized}>
            <FiMinus size={10} />
          </WindowControl>
          <WindowControl label={`Expand ${project.name}`} color="bg-green-200" onClick={onExpand} pressed={isExpanded} />
        </div>
        <p className="ml-14 truncate text-center text-base text-[#16f2b3] lg:ml-20 lg:text-xl">
          {project.name}
        </p>
      </div>

      <div className={`relative z-10 grid border-t-[2px] border-indigo-900 transition-[grid-template-rows,opacity] duration-500 ease-out ${isMinimized ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
        <div className="overflow-hidden">
          <div className="px-4 py-4 lg:px-8 lg:py-8">
            <code className="font-mono text-xs md:text-sm lg:text-base">
              <div className="blink">
                <span className="mr-2 text-pink-500">const</span>
                <span className="mr-2 text-white">project</span>
                <span className="mr-2 text-pink-500">=</span>
                <span className="text-gray-400">{'{'}</span>
              </div>
              <div>
                <span className="ml-4 mr-2 text-white lg:ml-8">name:</span>
                <span className="text-gray-400">{`'`}</span>
                <span className="text-amber-300">{project.name}</span>
                <span className="text-gray-400">{`',`}</span>
              </div>

              {project.status && (
                <div>
                  <span className="ml-4 mr-2 text-white lg:ml-8">status:</span>
                  <span className="text-gray-400">{`'`}</span>
                  <span className="text-[#16f2b3]">{project.status}</span>
                  <span className="text-gray-400">{`',`}</span>
                </div>
              )}

              <div className="ml-4 mr-2 lg:ml-8">
                <span className="text-white">tools:</span>
                <span className="text-gray-400">{` ['`}</span>
                {project.tools.map((tag, i) => (
                  <React.Fragment key={i}>
                    <span className="text-amber-300">{tag}</span>
                    {project.tools?.length - 1 !== i && (
                      <span className="text-gray-400">{`', '`}</span>
                    )}
                  </React.Fragment>
                ))}
                <span className="text-gray-400">{"],"}</span>
              </div>
              <div>
                <span className="ml-4 mr-2 text-white lg:ml-8">myRole:</span>
                <span className="text-orange-400">{project.role}</span>
                <span className="text-gray-400">,</span>
              </div>
              <div className="ml-4 mr-2 lg:ml-8">
                <span className="text-white">Description:</span>
                <span className="text-cyan-400">{' ' + project.description}</span>
                <span className="text-gray-400">,</span>
              </div>
              <div><span className="text-gray-400">{`};`}</span></div>
            </code>
          </div>

          <div className={`grid transition-[grid-template-rows,opacity,transform] duration-500 ease-out ${isExpanded ? 'grid-rows-[1fr] translate-y-0 opacity-100' : 'grid-rows-[0fr] -translate-y-3 opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="mx-3 mb-4 overflow-hidden rounded-lg border border-cyan-300/20 bg-[#080b22]/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] lg:mx-6 lg:mb-6">
                <div className="grid gap-5 p-4 md:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] lg:p-6">
                  <div className="project-media-reveal relative min-h-[220px] overflow-hidden rounded-md border border-white/10 bg-[#06091d] md:min-h-[320px]">
                    <div className="project-window-scan absolute inset-0 z-10 pointer-events-none"></div>
                    {previewImage && (
                      <Image
                        key={`${project.id}-${currentSlide}`}
                        src={previewImage}
                        alt={`${project.name} preview ${currentSlide + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 58vw"
                        className={`project-slide-image ${project.imageKind === 'logo' ? 'project-logo-float object-contain p-10 sm:p-14' : 'object-contain object-center p-1'} transition-transform duration-700 ease-out ${isExpanded ? 'scale-100' : 'scale-95'}`}
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
                            className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === index ? 'w-5 bg-[#16f2b3]' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                          />
                        ))}
                      </div>
                    )}
                    {project.status && (
                      <span className="absolute left-3 top-3 z-20 rounded-full border border-[#16f2b3]/40 bg-[#071323]/85 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#16f2b3]">
                        {project.status}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col justify-between gap-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pink-300/90">
                        CV Project Notes
                      </p>
                      <h3 className="mt-2 text-xl font-semibold leading-tight text-white md:text-2xl">
                        {project.name}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {project.description}
                      </p>
                    </div>

                    <ul className="space-y-3 text-sm leading-6 text-slate-200">
                      {details.map((detail, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16f2b3] shadow-[0_0_14px_rgba(22,242,179,0.7)]"></span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap gap-2">
                      {project.tools.slice(0, 8).map((tool) => (
                        <span key={tool} className="rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-100">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMinimized && (
        <div className="border-t border-indigo-900 px-4 py-3 text-center text-xs uppercase tracking-[0.2em] text-slate-400">
          Minimized
        </div>
      )}
    </div>
  );
}

export default ProjectCard;
