"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { FiCalendar } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import SectionVisualFrame from "../../helper/section-visual-frame";


function Experience({ experiences, section = {} }) {
  const [activeId, setActiveId] = useState(experiences[0]?.id || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [activeId]);

  const leftVariants = {
    hidden: {
      opacity: 0,
      x: isMobile ? 0 : -80,
      y: isMobile ? 30 : 0,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.85,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const rightVariants = {
    hidden: {
      opacity: 0,
      x: isMobile ? 0 : 80,
      y: isMobile ? 30 : 0,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.85,
        ease: [0.16, 1, 0.3, 1],
        delay: isMobile ? 0.15 : 0,
      },
    },
  };

  return (
    <SectionVisualFrame id="experience" variant="timeline" accent="cyan" className="relative z-50 border-t my-12 lg:my-24 border-[#262626]">
      {/* Animated Header Badge & Divider Lines */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex justify-center my-5 lg:py-8"
      >
        <div className="flex items-center">
          <motion.span
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="h-px w-24 bg-[#262626] origin-right"
          />
          <span className="w-fit rounded-md bg-[#151515] p-2 px-5 font-mono text-sm font-bold uppercase tracking-[0.14em] text-[#f4f1e8]">
            {section.heading || "Experiences"}
          </span>
          <motion.span
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="h-px w-24 bg-[#262626] origin-left"
          />
        </div>
      </motion.div>

      <div className="py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10">
          
          {/* Sidebar Tabs - Left Column (Converging from Left) */}
          <motion.div
            variants={leftVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="col-span-1 md:col-span-4 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 horizontal-scrollbar snap-x"
          >
            {experiences.map((exp) => {
              const isActive = activeId === exp.id;
              return (
                <button
                  key={exp.id}
                  onClick={() => setActiveId(exp.id)}
                  className={`snap-center shrink-0 flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-300 w-[260px] md:w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2E8F0] ${
                    isActive
                      ? "bg-[#E2E8F0]/5 border-[#E2E8F0]/45"
                      : "bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/20"
                  }`}
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-center p-1.5">
                    <Image
                      src={exp.image}
                      alt={exp.company}
                      width={32}
                      height={32}
                      className="h-full w-full object-contain rounded"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[10px] font-bold font-mono tracking-wider uppercase ${isActive ? "text-[#34D399]" : "text-zinc-500"}`}>
                      {exp.company}
                    </p>
                    <p className="text-sm font-semibold text-white truncate mt-0.5">
                      {exp.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </motion.div>

          {/* Detailed Showcase Card - Right Column (Converging from Right) */}
          <motion.div
            variants={rightVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="col-span-1 md:col-span-8 min-h-[460px] md:min-h-[480px]"
          >
            <AnimatePresence mode="wait">
              {experiences
                .filter((exp) => exp.id === activeId)
                .map((exp) => (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="w-full min-h-[460px] md:min-h-[480px] p-6 sm:p-8 rounded-2xl border border-zinc-800/80 bg-[#0a0a0a]/80 backdrop-blur-md shadow-xl relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="relative z-10 flex-1 flex flex-col h-full justify-between">
                      <div>
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
                          <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-center p-2.5 shadow-md">
                              <Image
                                src={exp.image}
                                alt={exp.company}
                                width={54}
                                height={54}
                                className="h-full w-full object-contain rounded-lg"
                              />
                            </div>
                            <div>
                              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white uppercase">
                                {exp.title}
                              </h3>
                              <p className="text-base font-semibold text-[#E2E8F0] mt-0.5">
                                {exp.company}
                              </p>
                            </div>
                          </div>
                          
                          <div className="self-start sm:self-center">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-3 py-1 font-mono text-xs font-semibold text-[#34D399]">
                              <FiCalendar className="w-3.5 h-3.5" />
                              {exp.duration}
                            </span>
                          </div>
                        </div>

                        {/* Detailed Highlights or Loader */}
                        <div className="mt-6 flex-1 flex flex-col min-h-[260px]">
                          <p className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-zinc-500 mb-4">
                            Key Contributions & Highlights
                          </p>
                          <AnimatePresence mode="wait">
                            {isLoading ? (
                              <motion.div
                                key="loader"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex-1 flex flex-col items-center justify-center py-6 min-h-[220px]"
                              >
                                <style>{`
                                  @keyframes miniFadeIn {
                                    0% { opacity: 0; filter: blur(4px); transform: translateY(4px); }
                                    100% { opacity: 1; filter: blur(0px); transform: translateY(0); }
                                  }
                                  .loader-t {
                                    animation: miniFadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                                  }
                                  .loader-q {
                                    animation: miniFadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                                    animation-delay: 0.15s;
                                    opacity: 0;
                                  }
                                `}</style>
                                
                                <div className="relative flex flex-col items-center justify-center">
                                  <div className="flex items-center -space-x-2">
                                    <span className="loader-t text-5xl font-serif font-light text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-[#E2E8F0] z-20">
                                      T
                                    </span>
                                    <span className="loader-q z-10 bg-gradient-to-r from-[#E2E8F0] via-[#f8fafc] to-[#94A3B8] bg-clip-text font-mono text-5xl font-light text-transparent opacity-90 mix-blend-screen">
                                      Q
                                    </span>
                                  </div>

                                  <div className="mt-5 flex flex-col items-center">
                                    <span className="text-[10px] font-mono tracking-[0.3em] text-[#34D399] uppercase animate-pulse">
                                      Accessing Credentials...
                                    </span>
                                    <div className="mt-3 flex gap-1.5">
                                      <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] animate-bounce" style={{ animationDelay: '0ms' }} />
                                      <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] animate-bounce" style={{ animationDelay: '150ms' }} />
                                      <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.ul
                                key="highlights"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.22 }}
                                className="space-y-4 text-zinc-300 text-sm sm:text-[15px] leading-relaxed"
                              >
                                {exp.highlights.map((highlight, index) => (
                                  <li key={index} className="flex gap-4">
                                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#34D399]" />
                                    <span>{highlight}</span>
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </SectionVisualFrame>
  );
}

export default Experience;

