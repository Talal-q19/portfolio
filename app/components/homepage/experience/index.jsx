"use client";

import { experiences } from "@/utils/data/experience";
import Image from "next/image";
import { useState } from "react";
import { FiChevronDown, FiCalendar } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import SectionVisualFrame from "../../helper/section-visual-frame";

const companyLogos = {
  "EUNX Investment LLC": "/company-logos/eunx.jpg",
  "Federal Electrical": "/company-logos/federal_electric.jpg",
  "Bacha Smart Solutions": "/company-logos/bacha_smart_solutions.jpg",
};

function Experience() {
  const [activeId, setActiveId] = useState(experiences[0]?.id || 1);

  return (
    <SectionVisualFrame id="experience" variant="timeline" accent="cyan" className="relative z-50 border-t my-12 lg:my-24 border-[#262626]">
      <Image
        src="/section.svg"
        alt="Hero"
        width={1572}
        height={795}
        className="absolute left-1/2 top-0 -z-10 w-full max-w-[1572px] -translate-x-1/2"
      />

      <div className="flex justify-center my-5 lg:py-8">
        <div className="flex items-center">
          <span className="h-px w-24 bg-[#262626]"></span>
          <span className="w-fit rounded-md bg-[#151515] p-2 px-5 font-mono text-sm font-bold uppercase tracking-[0.14em] text-[#f4f1e8]">
            Experiences
          </span>
          <span className="h-px w-24 bg-[#262626]"></span>
        </div>
      </div>

      <div className="py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10">
          
          {/* Sidebar Tabs - Left Column */}
          <div className="col-span-1 md:col-span-4 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 horizontal-scrollbar snap-x">
            {experiences.map((exp) => {
              const isActive = activeId === exp.id;
              return (
                <button
                  key={exp.id}
                  onClick={() => setActiveId(exp.id)}
                  className={`snap-center shrink-0 flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-300 w-[260px] md:w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${
                    isActive
                      ? "bg-[#D4AF37]/5 border-[#D4AF37]/45 shadow-[0_0_20px_rgba(212,175,55,0.06)]"
                      : "bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/20"
                  }`}
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-center p-1.5">
                    <Image
                      src={companyLogos[exp.company] || "/company-logos/default.jpg"}
                      alt={exp.company}
                      width={32}
                      height={32}
                      className="h-full w-full object-contain rounded"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[10px] font-bold font-mono tracking-wider uppercase ${isActive ? "text-[#D4AF37]" : "text-zinc-500"}`}>
                      {exp.company}
                    </p>
                    <p className="text-sm font-semibold text-white truncate mt-0.5">
                      {exp.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Showcase Card - Right Column (Stable height container to avoid layout shift) */}
          <div className="col-span-1 md:col-span-8 min-h-[460px] md:min-h-[480px]">
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
                    className="ufo-panel w-full min-h-[460px] md:min-h-[480px] p-6 sm:p-8 rounded-2xl border border-zinc-800/80 bg-zinc-950/20 shadow-xl relative overflow-hidden flex flex-col justify-between hover:transform-none"
                    style={{ transition: "none" }}
                  >
                    <div className="relative z-10 flex-1">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
                        <div className="flex items-center gap-4">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-center p-2.5 shadow-md">
                            <Image
                              src={companyLogos[exp.company] || "/company-logos/default.jpg"}
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
                            <p className="text-base font-semibold text-[#D4AF37] mt-0.5">
                              {exp.company}
                            </p>
                          </div>
                        </div>
                        
                        <div className="self-start sm:self-center">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/5 px-3 py-1 font-mono text-xs font-semibold text-[#D4AF37]">
                            <FiCalendar className="w-3.5 h-3.5" />
                            {exp.duration}
                          </span>
                        </div>
                      </div>

                      {/* Detailed Highlights */}
                      <div className="mt-6">
                        <p className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-zinc-500 mb-4">
                          Key Contributions & Highlights
                        </p>
                        <ul className="space-y-4 text-zinc-300 text-sm sm:text-[15px] leading-relaxed">
                          {exp.highlights.map((highlight, index) => (
                            <li key={index} className="flex gap-4">
                              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </SectionVisualFrame>
  );
};

export default Experience;
