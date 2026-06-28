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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="flex justify-center items-center">
            <div className="w-full max-w-[340px] aspect-square flex items-center justify-center relative bg-[#07101d]/20 rounded-2xl border border-[#262626] p-6 shadow-[0_0_50px_rgba(212,175,55,0.03)]">
              <svg viewBox="0 0 400 400" className="w-full h-full text-[#D4AF37]" aria-hidden="true">
                <defs>
                  {/* Radial glow with gold & amber highlights */}
                  <radialGradient id="vibrantGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                    <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#050505" stopOpacity="0" />
                  </radialGradient>
                  {/* Metallic gold gradient for paths */}
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF" />
                    <stop offset="40%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                  <style>{`
                    @keyframes float-more {
                      0%, 100% { transform: translateY(0px) rotate(0deg); }
                      50% { transform: translateY(-12px) rotate(1deg); }
                    }
                    @keyframes orbit {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                    @keyframes pulse-glow {
                      0%, 100% { transform: scale(0.9); opacity: 0.2; }
                      50% { transform: scale(1.1); opacity: 0.6; }
                    }
                    .floating-main { animation: float-more 5s ease-in-out infinite; }
                    .orbiting-nodes { transform-origin: 200px 200px; animation: orbit 25s linear infinite; }
                    .ambient-pulse { transform-origin: 200px 200px; animation: pulse-glow 4s ease-in-out infinite; }
                  `}</style>
                </defs>

                 {/* Vibrant Background Ambient Pulse */}
                <circle cx="200" cy="200" r="160" fill="url(#vibrantGlow)" />
                <circle cx="200" cy="200" r="120" fill="none" stroke="#D4AF37" strokeOpacity="0.08" strokeWidth="4" className="ambient-pulse" />
                
                {/* Constellation Knowledge Nodes Orbiting */}
                <g className="orbiting-nodes">
                  {/* Dashed orbit circle */}
                  <circle cx="200" cy="200" r="140" fill="none" stroke="#D4AF37" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="6,4" />
                  {/* Floating circles/stars representing knowledge disciplines */}
                  <circle cx="200" cy="60" r="7" fill="#F59E0B" opacity="0.8" />
                  <line x1="200" y1="60" x2="200" y2="90" stroke="#D4AF37" strokeOpacity="0.2" strokeWidth="1" />
                  
                  <circle cx="340" cy="200" r="6" fill="#D4AF37" opacity="0.8" />
                  <circle cx="60" cy="200" r="8" fill="#FFF" opacity="0.9" />
                  <circle cx="200" cy="340" r="5" fill="#F59E0B" opacity="0.8" />
                </g>
 
                {/* Floating Main Group */}
                <g className="floating-main">
                  {/* Glowing Base Platform */}
                  <ellipse cx="200" cy="290" rx="90" ry="24" fill="#07101d" stroke="url(#goldGrad)" strokeWidth="2.5" />
                  <ellipse cx="200" cy="290" rx="70" ry="18" fill="none" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="1.5" />
                  
                  {/* Stacked Book base */}
                  <path d="M 120,245 L 280,245 L 290,265 L 110,265 Z" fill="#07101d" stroke="url(#goldGrad)" strokeWidth="2.5" />
                  <path d="M 280,245 L 280,265" stroke="url(#goldGrad)" strokeWidth="2" />
                  <path d="M 130,255 L 270,255" stroke="#F59E0B" strokeOpacity="0.5" strokeWidth="3" />
 
                  {/* Glowing Open Book */}
                  <g transform="translate(0, -10)">
                    {/* Left Page */}
                    <path d="M 200,210 C 170,195 130,195 100,205 L 100,165 C 130,155 170,155 200,170 Z" fill="#07101d" stroke="url(#goldGrad)" strokeWidth="2.5" />
                    {/* Right Page */}
                    <path d="M 200,210 C 230,195 270,195 300,205 L 300,165 C 270,155 230,155 200,170 Z" fill="#07101d" stroke="url(#goldGrad)" strokeWidth="2.5" />
                    {/* Spine */}
                    <line x1="200" y1="170" x2="200" y2="210" stroke="#FFF" strokeWidth="2.5" />
                    
                    {/* Sparkling gold notes/lines on pages */}
                    <line x1="120" y1="178" x2="180" y2="178" stroke="#D4AF37" strokeWidth="2" />
                    <line x1="120" y1="188" x2="170" y2="188" stroke="#D4AF37" strokeWidth="2" />
                    <line x1="120" y1="198" x2="160" y2="198" stroke="#D4AF37" strokeOpacity="0.6" strokeWidth="2" />
                    
                    <line x1="220" y1="178" x2="280" y2="178" stroke="#D4AF37" strokeWidth="2" />
                    <line x1="220" y1="188" x2="270" y2="188" stroke="#D4AF37" strokeWidth="2" />
                    <line x1="220" y1="198" x2="260" y2="198" stroke="#D4AF37" strokeOpacity="0.6" strokeWidth="2" />
                  </g>
 
                  {/* Elegant Glowing Graduation Cap floating above */}
                  <g transform="translate(0, -35)">
                    {/* Golden Cap Top Diamond */}
                    <polygon points="200,90 265,112 200,134 135,112" fill="#07101d" stroke="url(#goldGrad)" strokeWidth="3" />
                    <polygon points="200,96 250,112 200,128 150,112" fill="none" stroke="#F59E0B" strokeOpacity="0.4" strokeWidth="1.5" />
                    
                    {/* Cap base skull */}
                    <path d="M 170,123 L 170,143 C 170,152 230,152 230,143 L 230,123" fill="none" stroke="url(#goldGrad)" strokeWidth="2.5" />
                    
                    {/* Gold Tassel with moving effect */}
                    <path d="M 200,112 L 252,128 L 252,148" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="252" cy="151" r="4.5" fill="#FFF" className="ambient-pulse" />
                  </g>
                  
                  {/* Floating magic sparkles */}
                  <polygon points="200,56 203,63 211,63 205,67 207,74 200,70 193,74 195,67 189,63 197,63" fill="#FFF" />
                  <polygon points="110,95 112,100 117,100 113,103 115,108 110,105 105,108 107,103 103,100 108,100" fill="#D4AF37" />
                  <polygon points="290,95 292,100 297,100 293,103 295,108 290,105 285,108 287,103 283,100 288,100" fill="#F59E0B" />
                </g>
              </svg>
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
