"use client";

import { educations } from "@/utils/data/educations";
import Image from "next/image";
import { useState } from "react";
import { FiChevronDown, FiCalendar, FiMapPin } from "react-icons/fi";
import { IoSchoolOutline } from "react-icons/io5";
import SectionVisualFrame from "../../helper/section-visual-frame";

function Education() {
  const [expandedIds, setExpandedIds] = useState({});

  const toggleEducation = (id) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <SectionVisualFrame id="education" variant="timeline" accent="amber" className="relative z-50 border-t my-12 lg:my-24 border-[#262626]">
      <Image
        src="/section.svg"
        alt="Hero"
        width={1572}
        height={795}
        className="absolute left-1/2 top-0 -z-10 w-full max-w-[1572px] -translate-x-1/2"
      />
      <div className="flex justify-center -translate-y-[1px]">
        <div className="w-3/4">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#F59E0B]/60 to-transparent" />
        </div>
      </div>

      <div className="flex justify-center my-5 lg:py-8">
        <div className="flex items-center">
          <span className="h-px w-24 bg-[#262626]"></span>
          <span className="w-fit rounded-md bg-[#151515] p-2 px-5 font-mono text-sm font-bold uppercase tracking-[0.14em] text-[#f4f1e8]">
            Educations
          </span>
          <span className="h-px w-24 bg-[#262626]"></span>
        </div>
      </div>

      <div className="py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
          {educations.map((edu) => (
            <div
              key={edu.id}
              className="ufo-panel p-5 sm:p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/20 shadow-lg relative overflow-hidden transition-all duration-300 hover:border-[#D4AF37]/35"
            >
              {/* Card Header */}
              <div className="flex items-start gap-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-[#D4AF37]/5 text-[#D4AF37] flex items-center justify-center p-2 shadow-sm">
                  <IoSchoolOutline size={24} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-block rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#D4AF37] mb-1.5">
                    {edu.credential}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase truncate">
                    {edu.title}
                  </h4>
                  <p className="text-sm font-semibold text-zinc-400 mt-0.5">
                    {edu.institution}
                  </p>
                </div>
                
                <button
                  type="button"
                  aria-expanded={!!expandedIds[edu.id]}
                  onClick={() => toggleEducation(edu.id)}
                  className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-[#D4AF37] outline-none transition-all duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 focus-visible:border-[#D4AF37] cursor-pointer"
                >
                  <FiChevronDown
                    size={18}
                    aria-hidden="true"
                    className={`transition-transform duration-500 ease-out ${expandedIds[edu.id] ? "rotate-180 text-white" : "rotate-0"}`}
                  />
                </button>
              </div>

              {/* Metadata details row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[10.5px] text-zinc-400 mt-4 border-t border-zinc-900/60 pt-3">
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="w-3.5 h-3.5 text-[#D4AF37]/75" />
                  {edu.duration}
                </span>
                {edu.location && (
                  <span className="flex items-center gap-1.5">
                    <FiMapPin className="w-3.5 h-3.5 text-[#D4AF37]/75" />
                    {edu.location}
                  </span>
                )}
              </div>

              {/* Dropdown collapsible details */}
              <div
                className={`relative z-10 grid transition-[grid-template-rows,opacity,transform] duration-500 ease-out ${
                  expandedIds[edu.id] ? "grid-rows-[1fr] opacity-100 translate-y-0" : "grid-rows-[0fr] opacity-0 -translate-y-2"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="mt-4 border-t border-zinc-900/60 pt-4">
                    <div className="flex flex-col gap-5">
                      {/* Coursework & details */}
                      <div>
                        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-500 mb-2.5">
                          Focus Areas & Details
                        </p>
                        <ul className="space-y-2.5 text-zinc-300 text-sm leading-relaxed">
                          {edu.details.map((detail, idx) => (
                            <li key={idx} className="flex gap-2.5 items-start">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Certificate Image Preview */}
                      {edu.image && (
                        <div className="relative min-h-[160px] sm:min-h-[220px] w-full overflow-hidden rounded-xl border border-zinc-850 bg-zinc-950/65 group/img flex items-center justify-center">
                          <Image
                            src={edu.image}
                            alt={`${edu.title} ${edu.credential}`}
                            fill
                            sizes="(max-width: 1024px) 100vw, 42vw"
                            className="object-contain p-3 transition-transform duration-500 group-hover/img:scale-105"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionVisualFrame>
  );
}

export default Education;
