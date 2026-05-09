'use client';

import { useState } from 'react';
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
    <SectionVisualFrame id='projects' variant="projects" accent="pink" className={`relative z-30 my-12 transition-[padding-bottom] duration-500 ease-out lg:my-24 ${hasActiveProject ? 'pb-20 lg:pb-28' : 'pb-0'}`}>
      <div className="sticky top-[var(--nav-safe-top)]">
        <div className="w-[80px] h-[80px] bg-violet-100 rounded-full absolute -top-3 left-0 translate-x-1/2 filter blur-3xl  opacity-30"></div>
        <div className="flex items-center justify-start relative">
          <span className="bg-[#1a1443] absolute left-0  w-fit text-white px-5 py-3 text-xl rounded-md">
            PROJECTS
          </span>
          <span className="w-full h-[2px] bg-[#1a1443]"></span>
        </div>
      </div>

      <div className="pt-24">
        <div className={`flex flex-col transition-[gap] duration-500 ease-out ${hasActiveProject ? 'gap-10' : 'gap-6'}`}>
          {projectsData.slice(0, 4).map((project, index) => (
            <div
              id={`sticky-card-${index + 1}`}
              key={index}
              className={`w-full mx-auto transition-[max-width,transform] duration-500 ease-out ${hasActiveProject ? 'relative' : 'sticky-card sticky'} ${expandedProjectId === project.id ? 'max-w-4xl scale-[1.005]' : 'max-w-2xl scale-100'}`}
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
            </div>
          ))}
        </div>
      </div>
    </SectionVisualFrame>
  );
};

export default Projects;
