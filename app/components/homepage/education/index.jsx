"use client";

import { educations } from "@/utils/data/educations";
import Image from "next/image";
import { useState } from "react";
import { BsPersonWorkspace } from "react-icons/bs";
import { FiChevronDown } from "react-icons/fi";
import lottieFile from '../../../assets/lottie/study.json';
import AnimationLottie from "../../helper/animation-lottie";
import GlowCard from "../../helper/glow-card";
import SectionVisualFrame from "../../helper/section-visual-frame";

function Education() {
  const [expandedEducations, setExpandedEducations] = useState({});

  const toggleEducation = (id) => {
    setExpandedEducations((current) => ({
      ...current,
      [id]: !current[id],
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
        <div className="flex  items-center">
          <span className="h-px w-24 bg-[#262626]"></span>
          <span className="w-fit rounded-md bg-[#151515] p-2 px-5 font-mono text-sm font-bold uppercase tracking-[0.14em] text-[#f4f1e8]">
            Educations
          </span>
          <span className="h-px w-24 bg-[#262626]"></span>
        </div>
      </div>

      <div className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="flex justify-center items-start">
            <div className="w-3/4 h-3/4">
              <AnimationLottie animationPath={lottieFile} />
            </div>
          </div>

          <div>
            <div className="relative flex flex-col gap-6 pl-4 sm:pl-6">
              <div aria-hidden="true" className="timeline-node-line absolute bottom-4 left-1 top-4 w-px rounded-full sm:left-2" />
              {
                educations.map(education => (
                  <GlowCard key={education.id} identifier={`education-${education.id}`}>
                    <div className="p-3 relative overflow-hidden text-white">
                      <span aria-hidden="true" className="absolute left-1 top-9 z-20 h-3 w-3 rounded-full border border-[#F59E0B]/70 bg-[#07101d] shadow-[0_0_16px_rgba(255,207,112,0.55)]" />
                      <svg aria-hidden="true" className="absolute inset-0 z-0 h-full w-full pointer-events-none" viewBox="0 0 520 180" preserveAspectRatio="none">
                        <path
                          className="timeline-card-trace"
                          data-active={expandedEducations[education.id] ? "true" : "false"}
                          d="M18 42 H132 C192 42 205 126 276 126 H502"
                          fill="none"
                          stroke="rgba(252,211,77,0.5)"
                          strokeWidth="1.2"
                        />
                      </svg>
                      <Image
                        src="/blur-23.svg"
                        alt="Hero"
                        width={1080}
                        height={200}
                        className="absolute bottom-0 opacity-80 pointer-events-none"
                      />
                      <div className="relative z-10 flex justify-center">
                        <p className="text-xs sm:text-sm text-[#D4AF37]">
                          {education.duration}
                        </p>
                      </div>
                      <div className="relative z-10 flex items-center gap-x-5 px-3 py-5 sm:gap-x-8">
                        <div className="text-[#F59E0B] transition-all duration-300 hover:scale-110">
                          <BsPersonWorkspace size={36} aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <p className="text-base font-medium uppercase sm:text-xl">
                              {education.title}
                            </p>
                            <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                              {education.credential}
                            </span>
                          </div>
                          <p className="text-sm sm:text-base">
                            {education.institution}
                          </p>
                          {education.location && (
                            <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                              {education.location}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          aria-expanded={!!expandedEducations[education.id]}
                          aria-controls={`education-details-${education.id}`}
                          onClick={() => toggleEducation(education.id)}
                          className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#262626] bg-[#07101d]/80 text-[#D4AF37] outline-none transition-all duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 focus-visible:border-[#D4AF37]"
                        >
                          <span className="sr-only">
                            {expandedEducations[education.id] ? "Hide details" : "Show details"}
                          </span>
                          <FiChevronDown
                            size={22}
                            aria-hidden="true"
                            className={`transition-transform duration-500 ease-out ${expandedEducations[education.id] ? "rotate-180" : "rotate-0"}`}
                          />
                        </button>
                      </div>

                      <div
                        id={`education-details-${education.id}`}
                        className={`relative z-10 grid transition-[grid-template-rows,opacity,transform] duration-500 ease-out ${expandedEducations[education.id] ? "grid-rows-[1fr] opacity-100 translate-y-0" : "grid-rows-[0fr] opacity-0 -translate-y-2"}`}
                      >
                        <div className="overflow-hidden">
                          <div className="mx-3 mb-3 border-t border-[#262626] pt-4">
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                              <div className="relative min-h-[220px] overflow-hidden rounded-md border border-[#262626]/80 bg-[#03060d] sm:min-h-[280px]">
                                <Image
                                  src={education.image}
                                  alt={`${education.title} ${education.credential}`}
                                  fill
                                  sizes="(max-width: 1024px) 100vw, 42vw"
                                  className="object-contain p-2"
                                />
                              </div>

                              <div>
                                <div className="mb-4 grid grid-cols-1 gap-3 rounded-md border border-[#262626]/80 bg-[#07101d]/60 p-3 sm:grid-cols-2">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">
                                      Credential
                                    </p>
                                    <p className="mt-1 text-sm text-gray-200">
                                      {education.credential}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">
                                      Institution
                                    </p>
                                    <p className="mt-1 text-sm text-gray-200">
                                      {education.institution}
                                    </p>
                                  </div>
                                </div>
                                <ul className="space-y-3 text-sm leading-6 text-gray-300 sm:text-[15px]">
                                  {education.details.map((detail) => (
                                    <li key={detail} className="flex gap-3">
                                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4AF37] shadow-[0_0_12px_rgba(100,216,255,0.7)]" />
                                      <span>{detail}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlowCard>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </SectionVisualFrame>
  );
};

export default Education;
