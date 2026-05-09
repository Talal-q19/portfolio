"use client";

import { experiences } from "@/utils/data/experience";
import Image from "next/image";
import { useState } from "react";
import { BsPersonWorkspace } from "react-icons/bs";
import { FiChevronDown } from "react-icons/fi";
import experience from '../../../assets/lottie/code.json';
import AnimationLottie from "../../helper/animation-lottie";
import GlowCard from "../../helper/glow-card";
import SectionVisualFrame from "../../helper/section-visual-frame";

const companyLogos = {
  "EUNX Investment LLC": "/company-logos/eunx.jpg",
  "Federal Electrical": "/company-logos/federal_electric.jpg",
  "Bacha Smart Solutions": "/company-logos/bacha_smart_solutions.jpg",
};

function Experience() {
  const [expandedExperiences, setExpandedExperiences] = useState({});

  const toggleExperience = (id) => {
    setExpandedExperiences((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  return (
    <SectionVisualFrame id="experience" variant="timeline" accent="violet" className="relative z-50 border-t my-12 lg:my-24 border-[#25213b]">
      <Image
        src="/section.svg"
        alt="Hero"
        width={1572}
        height={795}
        className="absolute top-0 -z-10"
      />

      <div className="flex justify-center my-5 lg:py-8">
        <div className="flex  items-center">
          <span className="w-24 h-[2px] bg-[#1a1443]"></span>
          <span className="bg-[#1a1443] w-fit text-white p-2 px-5 text-xl rounded-md">
            Experiences
          </span>
          <span className="w-24 h-[2px] bg-[#1a1443]"></span>
        </div>
      </div>

      <div className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="flex justify-center items-start">
            <div className="w-full h-full">
              <AnimationLottie animationPath={experience} />
            </div>
          </div>

          <div>
            <div className="relative flex flex-col gap-6 pl-4 sm:pl-6">
              <div aria-hidden="true" className="timeline-node-line absolute bottom-4 left-1 top-4 w-px rounded-full sm:left-2" />
              {
                experiences.map(experience => (
                  <GlowCard key={experience.id} identifier={`experience-${experience.id}`}>
                    <div className="p-3 relative overflow-hidden">
                      <span aria-hidden="true" className="absolute left-1 top-9 z-20 h-3 w-3 rounded-full border border-[#16f2b3]/70 bg-[#0d1224] shadow-[0_0_16px_rgba(22,242,179,0.75)]" />
                      <svg aria-hidden="true" className="absolute inset-0 z-0 h-full w-full pointer-events-none" viewBox="0 0 520 180" preserveAspectRatio="none">
                        <path
                          className="timeline-card-trace"
                          data-active={expandedExperiences[experience.id] ? "true" : "false"}
                          d="M18 42 H138 C196 42 200 132 268 132 H502"
                          fill="none"
                          stroke="rgba(22,242,179,0.56)"
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
                        <p className="text-xs sm:text-sm text-[#16f2b3]">
                          {experience.duration}
                        </p>
                      </div>
                      <div className="relative z-10 flex items-center gap-x-8 px-3 py-5">
                        <div className="text-violet-500 transition-all duration-300 hover:scale-125">
                          <BsPersonWorkspace size={36} aria-hidden="true" />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center">
                          <Image
                            src={companyLogos[experience.company]}
                            alt={experience.company}
                            width={48}
                            height={48}
                            className="mr-4 h-12 w-12 shrink-0 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <p className="mb-2 text-base font-medium uppercase sm:text-xl">
                              {experience.title}
                            </p>
                            <p className="text-sm sm:text-base">
                              {experience.company}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-expanded={!!expandedExperiences[experience.id]}
                          aria-controls={`experience-details-${experience.id}`}
                          onClick={() => toggleExperience(experience.id)}
                          className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#2a2e5a] bg-[#0d1224]/80 text-[#16f2b3] outline-none transition-all duration-300 hover:border-[#16f2b3] hover:bg-[#16f2b3]/10 focus-visible:border-[#16f2b3]"
                        >
                          <span className="sr-only">
                            {expandedExperiences[experience.id] ? "Hide details" : "Show details"}
                          </span>
                          <FiChevronDown
                            size={22}
                            aria-hidden="true"
                            className={`transition-transform duration-500 ease-out ${expandedExperiences[experience.id] ? "rotate-180" : "rotate-0"}`}
                          />
                        </button>
                      </div>

                      <div
                        id={`experience-details-${experience.id}`}
                        className={`relative z-10 grid transition-[grid-template-rows,opacity,transform] duration-500 ease-out ${expandedExperiences[experience.id] ? "grid-rows-[1fr] opacity-100 translate-y-0" : "grid-rows-[0fr] opacity-0 -translate-y-2"}`}
                      >
                        <div className="overflow-hidden">
                          <div className="mx-3 mb-3 border-t border-[#2a2e5a] pt-4">
                            <ul className="space-y-3 text-sm leading-6 text-gray-300 sm:text-[15px]">
                              {experience.highlights.map((highlight) => (
                                <li key={highlight} className="flex gap-3">
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16f2b3] shadow-[0_0_12px_rgba(22,242,179,0.8)]" />
                                  <span>{highlight}</span>
                                </li>
                              ))}
                            </ul>
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

export default Experience;
