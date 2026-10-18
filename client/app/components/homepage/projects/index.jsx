"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { projectsData } from "@/utils/data/projects-data";
import { useReducedMotion } from "@/app/hooks/use-reduced-motion";
import SectionVisualFrame from "../../helper/section-visual-frame";
import ProjectCard from "./project-card";

const PROJECT_GUIDE_KEY = "talal-portfolio-project-guide-dismissed";

const Projects = () => {
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [minimizedProjects, setMinimizedProjects] = useState({});
  const [closedProjects, setClosedProjects] = useState({});
  const [guideChecked, setGuideChecked] = useState(false);
  const [isProjectsVisible, setIsProjectsVisible] = useState(false);
  const [guideDismissed, setGuideDismissed] = useState(true);
  const sectionRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const hasExpandedProject = expandedProjectId !== null;
  const hasActiveProject = hasExpandedProject || Object.values(minimizedProjects).some(Boolean);

  useEffect(() => {
    try {
      setGuideDismissed(window.localStorage.getItem(PROJECT_GUIDE_KEY) === "true");
    } catch {
      setGuideDismissed(false);
    }
    setGuideChecked(true);
  }, []);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(([entry]) => setIsProjectsVisible(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const dismissGuide = useCallback(() => {
    setGuideDismissed(true);
    try {
      window.localStorage.setItem(PROJECT_GUIDE_KEY, "true");
    } catch {
      // The guide remains dismissed during this visit when storage is unavailable.
    }
  }, []);

  const handleExpand = (projectId) => {
    setExpandedProjectId((currentId) => currentId === projectId ? null : projectId);
    setMinimizedProjects((current) => ({ ...current, [projectId]: false }));
  };

  const handleMinimize = (projectId) => {
    setMinimizedProjects((current) => ({ ...current, [projectId]: !current[projectId] }));
    if (expandedProjectId === projectId) setExpandedProjectId(null);
  };

  const handleClose = (projectId) => {
    setClosedProjects((current) => ({ ...current, [projectId]: true }));
    if (expandedProjectId === projectId) setExpandedProjectId(null);
    setMinimizedProjects((current) => ({ ...current, [projectId]: false }));
  };

  const handleRestore = (projectId) => setClosedProjects((current) => ({ ...current, [projectId]: false }));

  return (
    <SectionVisualFrame ref={sectionRef} id="projects" variant="projects" accent="cyan" className={`relative z-30 my-12 transition-[padding-bottom] duration-300 ease-out lg:my-24 ${hasActiveProject ? "pb-20 lg:pb-28" : "pb-0"}`}>
      <div className="sticky top-[var(--nav-safe-top)]">
        <div className="relative flex items-center justify-start">
          <span className="absolute left-0 w-fit rounded-md bg-[#151515] px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.14em] text-[#f4f1e8]">PROJECTS</span>
          <span className="h-px w-full bg-[#262626]" />
        </div>
      </div>

      <div className="pt-24">
        <div className="mb-6 max-w-5xl border-l-2 border-[#64d8ff]/60 pl-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#64d8ff]">Selected case studies</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">Open a window to review the role, technical approach, and measurable outcome behind each project.</p>
        </div>
        <div className={`flex flex-col transition-[gap] duration-300 ease-out ${hasActiveProject ? "gap-6" : "gap-4"}`}>
          {projectsData.map((project, index) => {
            const isClosed = !!closedProjects[project.id];
            return (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.28, delay: prefersReducedMotion ? 0 : Math.min(index * 0.05, 0.2), ease: "easeOut" }}
                id={`sticky-card-${index + 1}`}
                key={project.id}
                className={`w-full mx-auto transition-[max-width,transform] duration-300 ease-out ${hasActiveProject ? "relative" : "sticky-card sticky"} ${expandedProjectId === project.id ? "max-w-6xl scale-[1.005]" : "max-w-5xl scale-100"}`}
              >
                {isClosed ? (
                  <button type="button" onClick={() => handleRestore(project.id)} className="group flex w-full max-w-5xl items-center justify-between rounded-lg border border-[#64d8ff]/30 bg-[#07101d]/65 p-4 px-5 text-left shadow-md transition-all duration-200 hover:border-[#64d8ff]/65 hover:bg-[#07101d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d8ff] sm:px-6">
                    <span><span className="block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#64d8ff]">Window closed</span><span className="mt-1 block text-sm font-semibold text-slate-200">Restore {project.name}</span></span>
                    <span className="rounded-md border border-[#64d8ff]/35 bg-[#64d8ff]/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#c6f1ff] transition-colors group-hover:bg-[#64d8ff]/20">Restore</span>
                  </button>
                ) : (
                  <ProjectCard project={project} projectNumber={index + 1} isExpanded={expandedProjectId === project.id} isMinimized={!!minimizedProjects[project.id]} onClose={() => handleClose(project.id)} onExpand={() => handleExpand(project.id)} onMinimize={() => handleMinimize(project.id)} showCoachMark={guideChecked && isProjectsVisible && !guideDismissed && index === 0} onDismissCoachMark={dismissGuide} />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </SectionVisualFrame>
  );
};

export default Projects;