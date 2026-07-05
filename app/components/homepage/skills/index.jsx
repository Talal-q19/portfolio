"use client";

// @flow strict

import { skillCategories } from "@/utils/data/skills";
import { skillsImage } from "@/utils/skill-image";
import Image from "next/image";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlay, FiPause, FiMaximize2, FiMinimize2 } from "react-icons/fi";

const accentStyles = {
  emerald: {
    badge: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
    title: "text-emerald-200",
    glow: "from-emerald-400/20 via-cyan-400/10 to-transparent",
    line: "via-emerald-400"
  },
  amber: {
    badge: "border-amber-300/40 bg-amber-300/10 text-amber-100",
    title: "text-amber-100",
    glow: "from-amber-300/20 via-orange-400/10 to-transparent",
    line: "via-amber-300"
  },
  sky: {
    badge: "border-sky-300/40 bg-sky-300/10 text-sky-100",
    title: "text-sky-100",
    glow: "from-sky-300/20 via-teal-300/10 to-transparent",
    line: "via-sky-300"
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 14
    }
  }
};

function Skills() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const activeCategory = skillCategories[activeSlide];
  const activeAccent = accentStyles[activeCategory.accent];

  const visibleSkills = useMemo(() => {
    return activeCategory.skills.filter((skill) => skillsImage(skill));
  }, [activeCategory]);

  const marqueeSkills = useMemo(() => {
    return [...visibleSkills, ...visibleSkills, ...visibleSkills];
  }, [visibleSkills]);

  return (
    <div id="skills" className="relative z-40 isolate overflow-hidden border-t my-12 pb-8 lg:my-24 lg:pb-12 border-[#262626]">
      <div className={`absolute left-1/2 top-10 h-28 w-2/3 -translate-x-1/2 bg-gradient-to-r ${activeAccent.glow} blur-3xl opacity-70`} />

      <div className="flex justify-center -translate-y-[1px]">
        <div className="w-3/4">
          <div className={`h-[1px] bg-gradient-to-r from-transparent ${activeAccent.line} to-transparent w-full`} />
        </div>
      </div>

      <div className="flex justify-center my-5 lg:py-8">
        <div className="flex items-center">
          <span className="h-px w-24 bg-[#262626]"></span>
          <span className="w-fit rounded-md bg-[#151515] p-2 px-5 font-mono text-sm font-bold uppercase tracking-[0.14em] text-[#f4f1e8]">
            Skills
          </span>
          <span className="h-px w-24 bg-[#262626]"></span>
        </div>
      </div>

      <div className="ufo-panel my-10 p-4 sm:p-6 lg:my-12">
        <div className="mb-6 flex min-h-[174px] flex-col gap-5 sm:min-h-[150px] lg:min-h-[116px] lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className={`inline-flex rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${activeAccent.badge}`}>
              {activeCategory.eyebrow}
            </span>
            <div className="mt-3 flex items-baseline gap-3">
              <p className="text-sm font-semibold text-[#a8b4c3]">
                0{activeSlide + 1}/0{skillCategories.length}
              </p>
              <h3 className={`text-2xl font-semibold sm:text-3xl ${activeAccent.title}`}>
                {activeCategory.title}
              </h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#a8b4c3] sm:text-base">
              {activeCategory.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Category switcher tabs */}
            <div className="grid h-fit grid-cols-3 gap-2 rounded-lg border border-[#262626] bg-[#07101d] p-1 flex-1 lg:flex-initial">
              {skillCategories.map((category, index) => {
                const isActive = index === activeSlide;

                return (
                  <button
                    key={category.title}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    className={`rounded-md px-3 py-2 text-xs font-semibold uppercase transition-all duration-300 sm:text-sm cursor-pointer ${isActive
                      ? `${accentStyles[category.accent].badge} shadow-lg shadow-black/20`
                      : "text-[#a8b4c3] hover:bg-[#151515] hover:text-white"
                      }`}
                    aria-pressed={isActive}
                  >
                    {category.title}
                  </button>
                );
              })}
            </div>

            {/* Animation Controls (Play/Pause, Expand) */}
            <div className="flex h-fit items-center gap-1 rounded-lg border border-[#262626] bg-[#07101d] p-1 shadow-md">
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                disabled={isExpanded}
                className="rounded-md p-2 text-xs font-semibold uppercase transition-all duration-300 text-[#a8b4c3] hover:bg-[#151515] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#a8b4c3] cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
                title={isPaused ? "Resume Slideshow" : "Pause Slideshow"}
                aria-label={isPaused ? "Resume Slideshow" : "Pause Slideshow"}
              >
                {isPaused ? <FiPlay size={16} /> : <FiPause size={16} />}
              </button>
              <span className="h-4 w-px bg-[#262626]" />
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded-md p-2 text-xs font-semibold uppercase transition-all duration-300 text-[#a8b4c3] hover:bg-[#151515] hover:text-white cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
                title={isExpanded ? "Collapse to Slideshow" : "Expand to Grid"}
                aria-label={isExpanded ? "Collapse to Slideshow" : "Expand to Grid"}
              >
                {isExpanded ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="relative border-t border-[#262626]/85 pt-6 min-h-[160px]">
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="grid-layout"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5"
                >
                  {visibleSkills.map((skill) => (
                    <motion.div
                      key={skill}
                      variants={itemVariants}
                      className="skill-card h-28 sm:h-32 flex flex-col items-center justify-center transition-all duration-500 rounded-lg group relative hover:scale-[1.08] cursor-pointer"
                    >
                      <div className="ufo-panel skill-card-inner h-full w-full transition-all duration-500">
                        <div className="flex -translate-y-[1px] justify-center">
                          <div className="w-3/4">
                            <div className={`h-[1px] w-full bg-gradient-to-r from-transparent ${activeAccent.line} to-transparent`} />
                          </div>
                        </div>
                        <div className="flex h-full flex-col items-center justify-center gap-3 p-4 sm:p-5">
                          <div className="h-8 sm:h-10">
                            <Image
                              src={skillsImage(skill)?.src}
                              alt={skill}
                              width={40}
                              height={40}
                              className="h-full w-auto rounded-lg"
                            />
                          </div>
                          <p className="max-w-full truncate px-1 text-center text-sm text-white sm:text-base">
                            {skill}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="slideshow-layout"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="skill-slide-panel h-[128px] overflow-hidden sm:h-[152px] flex items-center w-full"
              >
                <div
                  className="skill-marquee"
                  data-direction="left"
                  style={{
                    "--skill-marquee-duration": activeCategory.title === "Backend" ? "32s" : "30s"
                  }}
                >
                  <div
                    className="skill-marquee-track"
                    style={{
                      animationPlayState: isPaused ? "paused" : "running"
                    }}
                  >
                    {marqueeSkills.map((skill, id) => (
                      <div
                        className="skill-card w-32 min-w-[8rem] h-28 sm:h-32 flex flex-col items-center justify-center transition-all duration-500 m-2 sm:m-3 rounded-lg group relative hover:scale-[1.08] cursor-pointer"
                        key={`${skill}-${id}`}
                      >
                        <div className="ufo-panel skill-card-inner h-full w-full transition-all duration-500">
                          <div className="flex -translate-y-[1px] justify-center">
                            <div className="w-3/4">
                              <div className={`h-[1px] w-full bg-gradient-to-r from-transparent ${activeAccent.line} to-transparent`} />
                            </div>
                          </div>
                          <div className="flex h-full flex-col items-center justify-center gap-3 p-4 sm:p-5">
                            <div className="h-8 sm:h-10">
                              <Image
                                src={skillsImage(skill)?.src}
                                alt={skill}
                                width={40}
                                height={40}
                                className="h-full w-auto rounded-lg"
                              />
                            </div>
                            <p className="max-w-full truncate px-1 text-center text-sm text-white sm:text-base">
                              {skill}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default Skills;
