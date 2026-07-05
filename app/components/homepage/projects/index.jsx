'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { projectsData } from '@/utils/data/projects-data';
import SectionVisualFrame from '../../helper/section-visual-frame';
import ProjectCard from './project-card';

const Projects = () => {
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [minimizedProjects, setMinimizedProjects] = useState({});
  const hasExpandedProject = expandedProjectId !== null;
  const hasActiveProject = hasExpandedProject || Object.values(minimizedProjects).some(Boolean);

  const handleExpand = (projectId) => {
    setExpandedProjectId((currentId) => currentId === projectId ? null : projectId);
    setMinimizedProjects((current) => ({ ...current, [projectId]: false }));
  };

  const handleMinimize = (projectId) => {
    setMinimizedProjects((current) => ({
      ...current,
      [projectId]: !current[projectId],
    }));

    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
    }
  };

  const handleClose = (projectId) => {
    setExpandedProjectId((currentId) => currentId === projectId ? null : currentId);
    setMinimizedProjects((current) => ({ ...current, [projectId]: false }));
  };

  return (
    <SectionVisualFrame id='projects' variant="projects" accent="cyan" sectionTitle="Projects" sectionIndex="04" className={`relative z-30 my-12 transition-[padding-bottom] duration-500 ease-out lg:my-24 ${hasActiveProject ? 'pb-20 lg:pb-28' : 'pb-0'}`}>
      <div className="sticky top-[var(--nav-safe-top)]">
        <div className="absolute -top-3 left-0 h-20 w-20 translate-x-1/2 rounded-full bg-[#D4AF37] opacity-10 blur-3xl"></div>
        <div className="flex items-center justify-start relative">
          <span className="absolute left-0 w-fit rounded-md bg-[#151515] px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.14em] text-[#f4f1e8]">
            PROJECTS
          </span>
          <span className="h-px w-full bg-[#262626]"></span>
        </div>
      </div>

      <div className="pt-24">
        <div className={`flex flex-col transition-[gap] duration-500 ease-out ${hasActiveProject ? 'gap-6' : 'gap-4'}`}>
          {projectsData.map((project, index) => (
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
              id={`sticky-card-${index + 1}`}
              key={index}
              className={`w-full mx-auto transition-[max-width,transform] duration-500 ease-out ${hasActiveProject ? 'relative' : 'sticky-card sticky'} ${expandedProjectId === project.id ? 'max-w-6xl scale-[1.005]' : 'max-w-5xl scale-100'}`}
            >
              <div className="box-border flex items-center justify-center rounded shadow-[0_0_30px_0_rgba(0,0,0,0.3)] transition-all duration-[0.5s]">
                <ProjectCard
                  project={project}
                  isExpanded={expandedProjectId === project.id}
                  isMinimized={!!minimizedProjects[project.id]}
                  onClose={() => handleClose(project.id)}
                  onExpand={() => handleExpand(project.id)}
                  onMinimize={() => handleMinimize(project.id)}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionVisualFrame>
  );
};

export default Projects;
