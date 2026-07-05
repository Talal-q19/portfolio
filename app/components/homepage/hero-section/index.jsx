"use client";

// @flow strict

import { personalData } from "@/utils/data/personal-data";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BsGithub, BsLinkedin } from "react-icons/bs";
import { FaInstagram } from "react-icons/fa";
import { MdDownload } from "react-icons/md";
import { RiContactsFill } from "react-icons/ri";
import { useReducedMotion } from "../../../hooks/use-reduced-motion";
import SectionVisualFrame from "../../helper/section-visual-frame";
import GalaxyBackground from "../galaxy-background";

const codeLines = [
  [
    { text: "const ", className: "text-[#D4AF37]" },
    { text: "coder ", className: "text-[#f4f1e8]" },
    { text: "= ", className: "text-[#D4AF37]" },
    { text: "{", className: "text-[#718297]" },
  ],
  [
    { text: "  name: ", className: "text-white" },
    { text: "'", className: "text-gray-400" },
    { text: "Talal Qasim", className: "text-amber-300" },
    { text: "',", className: "text-gray-400" },
  ],
  [
    { text: "  skills: ", className: "text-white" },
    { text: "['", className: "text-gray-400" },
    { text: "Java", className: "text-amber-300" },
    { text: "', '", className: "text-gray-400" },
    { text: "Spring Boot", className: "text-amber-300" },
    { text: "', '", className: "text-gray-400" },
    { text: "Python", className: "text-amber-300" },
    { text: "', '", className: "text-gray-400" },
    { text: "PostgreSQL", className: "text-amber-300" },
    { text: "', '", className: "text-gray-400" },
    { text: "Kafka", className: "text-amber-300" },
    { text: "', '", className: "text-gray-400" },
    { text: "Docker", className: "text-amber-300" },
    { text: "', '", className: "text-gray-400" },
    { text: "AWS", className: "text-amber-300" },
    { text: "', '", className: "text-gray-400" },
    { text: "Redis", className: "text-amber-300" },
    { text: "', '", className: "text-gray-400" },
    { text: "WebSockets", className: "text-amber-300" },
    { text: "'],", className: "text-gray-400" },
  ],
  [
    { text: "  hardWorker: ", className: "text-white" },
    { text: "true", className: "text-orange-400" },
    { text: ",", className: "text-gray-400" },
  ],
  [
    { text: "  quickLearner: ", className: "text-white" },
    { text: "true", className: "text-orange-400" },
    { text: ",", className: "text-gray-400" },
  ],
  [
    { text: "  problemSolver: ", className: "text-white" },
    { text: "true", className: "text-orange-400" },
    { text: ",", className: "text-gray-400" },
  ],
  [
    { text: "  hireable: ", className: "text-green-400" },
    { text: "function", className: "text-orange-400" },
    { text: "() {", className: "text-gray-400" },
  ],
  [
    { text: "    return", className: "text-orange-400" },
    { text: "(", className: "text-gray-400" },
  ],
  [
    { text: "      this.", className: "text-cyan-400" },
    { text: "hardWorker ", className: "text-white" },
    { text: "&&", className: "text-amber-300" },
  ],
  [
    { text: "      this.", className: "text-cyan-400" },
    { text: "problemSolver ", className: "text-white" },
    { text: "&&", className: "text-amber-300" },
  ],
  [
    { text: "      this.", className: "text-cyan-400" },
    { text: "skills.length ", className: "text-white" },
    { text: ">= ", className: "text-amber-300" },
    { text: "5", className: "text-orange-400" },
  ],
  [{ text: "    );", className: "text-gray-400" }],
  [{ text: "  };", className: "text-gray-400" }],
  [{ text: "};", className: "text-gray-400" }],
];

function HeroSection() {
  const [typedCharacters, setTypedCharacters] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const totalCharacters = useMemo(() => {
    return codeLines.reduce((total, line) => (
      total + line.reduce((lineTotal, token) => lineTotal + token.text.length, 0)
    ), 0);
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setTypedCharacters(totalCharacters);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setTypedCharacters((current) => {
        if (current >= totalCharacters) {
          window.clearInterval(interval);
          return current;
        }

        return current + 1;
      });
    }, 28);

    return () => window.clearInterval(interval);
  }, [totalCharacters]);

  const renderTypedLine = (line, lineIndex) => {
    const charactersBeforeLine = codeLines
      .slice(0, lineIndex)
      .reduce((total, currentLine) => (
        total + currentLine.reduce((lineTotal, token) => lineTotal + token.text.length, 0)
      ), 0);
    let remainingCharacters = Math.max(0, typedCharacters - charactersBeforeLine);
    const lineLength = line.reduce((total, token) => total + token.text.length, 0);
    const isCursorLine = typedCharacters >= charactersBeforeLine
      && typedCharacters <= charactersBeforeLine + lineLength
      && typedCharacters < totalCharacters;

    return (
      <div
        key={`code-line-${lineIndex}`}
        className={`code-type-line flex items-start px-4 lg:px-8 py-0.5 border-l-2 transition-colors duration-150 ${
          isCursorLine
            ? "bg-[#D4AF37]/5 border-[#D4AF37]/60"
            : "border-transparent hover:bg-white/[0.02]"
        }`}
      >
        <span className="font-mono text-xs md:text-sm lg:text-[14px] select-none text-right mr-4 md:mr-6 w-8 text-[#718297]/40 shrink-0 font-medium whitespace-nowrap">
          {lineIndex + 1}
        </span>
        <div className="flex-grow font-mono text-xs md:text-sm lg:text-[14px] leading-relaxed whitespace-pre-wrap">
          {line.map((token, tokenIndex) => {
            const visibleText = token.text.slice(0, remainingCharacters);
            remainingCharacters = Math.max(0, remainingCharacters - token.text.length);

            if (!visibleText) {
              return null;
            }

            return (
              <span key={`code-token-${lineIndex}-${tokenIndex}`} className={token.className}>
                {visibleText}
              </span>
            );
          })}
          {isCursorLine && <span className="code-type-cursor" aria-hidden="true" />}
        </div>
      </div>
    );
  };

  return (
    <section className="relative w-full">
      <GalaxyBackground />
      <SectionVisualFrame id="about" variant="hero" accent="emerald" sectionTitle="Overview" sectionIndex="01" className="hero-space relative flex min-h-[calc(100svh-var(--nav-safe-top))] flex-col items-center justify-center py-8 lg:py-12">
        <div className="relative z-10 grid grid-cols-1 items-start gap-y-8 lg:grid-cols-2 lg:gap-12">
        <div className="order-2 lg:order-1 flex flex-col items-start justify-center p-2 pb-20 md:pb-10 lg:pt-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 mb-6">
            <div className="ufo-panel group relative aspect-square w-32 sm:w-44 shrink-0 rounded-full border border-[#D4AF37]/40 p-1.5 shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-500 hover:shadow-[0_0_50px_rgba(212,175,55,0.3)] hover:border-[#D4AF37]/80">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="relative h-full overflow-hidden rounded-full border border-[#ffffff]/10 bg-[#07101d] shadow-inner transition-all duration-500">
                <Image
                  src={personalData.profile}
                  fill
                  sizes="(min-width: 640px) 176px, 128px"
                  alt="Talal Qasim"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            </div>
            <div>
              <p className="mb-3 font-mono text-[0.68rem] font-bold uppercase tracking-[0.3em] text-[#D4AF37] sm:text-xs">
                Backend engineering · Dubai
              </p>
              <h1 className="text-4xl font-semibold leading-[1.1] text-[#f4f1e8] md:text-5xl lg:text-[3.6rem] tracking-tight max-w-3xl">
                Software Engineer
                <span className="block text-2xl md:text-4xl lg:text-[2.8rem] bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] bg-clip-text text-transparent drop-shadow-sm mt-2 md:mt-3">
                  Fintech Backend Engineer
                </span>
              </h1>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#a8b4c3]/90 md:text-lg font-light tracking-wide">
            {personalData.description}
          </p>

          <div className="my-12 flex items-center gap-6">
            <Link
              href={personalData.github}
              target='_blank'
              aria-label="GitHub profile"
              className="group flex h-12 w-12 items-center justify-center rounded-full border border-[#ffffff]/10 bg-[#07101d]/50 backdrop-blur-sm text-[#a8b4c3] transition-all duration-300 hover:border-[#D4AF37]/60 hover:text-[#D4AF37] hover:scale-110 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              <BsGithub size={24} className="transition-transform duration-300 group-hover:scale-110" />
            </Link>
            <Link
              href={personalData.linkedIn}
              target='_blank'
              aria-label="LinkedIn profile"
              className="group flex h-12 w-12 items-center justify-center rounded-full border border-[#ffffff]/10 bg-[#07101d]/50 backdrop-blur-sm text-[#a8b4c3] transition-all duration-300 hover:border-[#D4AF37]/60 hover:text-[#D4AF37] hover:scale-110 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              <BsLinkedin size={24} className="transition-transform duration-300 group-hover:scale-110" />
            </Link>
            <Link
              href={personalData.instagram}
              target='_blank'
              aria-label="Instagram profile"
              className="group flex h-12 w-12 items-center justify-center rounded-full border border-[#ffffff]/10 bg-[#07101d]/50 backdrop-blur-sm text-[#a8b4c3] transition-all duration-300 hover:border-[#D4AF37]/60 hover:text-[#D4AF37] hover:scale-110 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              <FaInstagram size={24} className="transition-transform duration-300 group-hover:scale-110" />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="#contact" className="group flex min-h-[50px] items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#07101d]/60 backdrop-blur-sm px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.15em] text-[#f4f1e8] transition-all duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 hover:shadow-[0_0_25px_rgba(212,175,55,0.15)] md:px-8">
              <span>Contact me</span>
              <RiContactsFill size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link className="group flex min-h-[50px] items-center gap-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.15em] text-[#07101d] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] md:px-8" role="button" target="_blank" href={personalData.resume}
            >
              <span>Get Resume</span>
              <MdDownload size={16} className="transition-transform duration-300 group-hover:translate-y-0.5" />
            </Link>
          </div>

        </div>
        <div className="ufo-panel order-1 lg:order-2 relative overflow-hidden rounded-2xl bg-[#07101d]/40 backdrop-blur-xl border border-[#ffffff]/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-500 hover:border-[#D4AF37]/30 hover:shadow-[0_16px_48px_rgba(212,175,55,0.1)]">
          {/* Top border decoration */}
          <div className="flex flex-row">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-[#F59E0B]/50"></div>
            <div className="h-[1px] w-full bg-gradient-to-r from-[#F59E0B]/50 to-transparent"></div>
          </div>
          
          {/* Window Header */}
          <div className="flex items-center justify-between border-b border-[#ffffff]/5 bg-[#07101d]/60 px-4 py-3 relative">
            <div className="flex items-center space-x-4">
              {/* Windows control dots */}
              <div className="flex flex-row space-x-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff5f56] shadow-[0_0_8px_rgba(255,95,86,0.3)]"></div>
                <div className="h-3 w-3 rounded-full bg-[#ffbd2e] shadow-[0_0_8px_rgba(255,189,46,0.3)]"></div>
                <div className="h-3 w-3 rounded-full bg-[#27c93f] shadow-[0_0_8px_rgba(39,201,63,0.3)]"></div>
              </div>
              
              {/* File Tabs */}
              <div className="flex items-center space-x-2 pl-4 border-l border-[#ffffff]/5">
                {/* Active Tab */}
                <div className="flex items-center space-x-2 rounded-md bg-[#07101d]/85 px-3 py-1 text-xs font-mono text-[#D4AF37] border border-[#ffffff]/5 shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                  <span className="text-[#f4f1e8]/90 font-semibold flex items-center gap-1.5">
                    <span className="text-xs text-[#F59E0B] font-bold">JS</span>
                    coder.js
                  </span>
                  <span className="text-[#718297]/60 hover:text-white cursor-pointer ml-1">×</span>
                </div>
                
                {/* Inactive Tab 1 */}
                <div className="hidden md:flex items-center space-x-2 rounded-md px-3 py-1 text-xs font-mono text-[#718297]/60 hover:text-[#718297]/90 transition-all cursor-pointer">
                  <span className="text-blue-400 font-bold">{}</span>
                  <span>skills.json</span>
                </div>

                {/* Inactive Tab 2 */}
                <div className="hidden sm:flex items-center space-x-2 rounded-md px-3 py-1 text-xs font-mono text-[#718297]/60 hover:text-[#718297]/90 transition-all cursor-pointer">
                  <span className="text-[#F59E0B] font-bold">M↓</span>
                  <span>README.md</span>
                </div>
              </div>
            </div>
            
            {/* Online indicator */}
            <div aria-hidden="true" className="flex items-center gap-1.5 rounded-full border border-[#D4AF37]/25 bg-[#07101d]/80 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37] shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <span className="h-2 w-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)] animate-pulse" />
              Signal online
            </div>
          </div>

          {/* Breadcrumbs bar */}
          <div className="flex items-center space-x-2 border-b border-[#ffffff]/5 bg-[#07101d]/20 px-4 py-1.5 text-xs font-mono text-[#718297]/60">
            <span>src</span>
            <span>&gt;</span>
            <span>components</span>
            <span>&gt;</span>
            <span>homepage</span>
            <span>&gt;</span>
            <span className="text-[#a8b4c3]/80 flex items-center gap-1">
              <span className="text-[10px] text-[#F59E0B] font-bold">JS</span>
              coder.js
            </span>
          </div>

          {/* Editor Body */}
          <div className="overflow-hidden py-4 lg:py-6 bg-[#07101d]/20">
            <code className="block font-mono leading-relaxed" aria-label="Animated code introduction">
              {codeLines.map(renderTypedLine)}
            </code>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between border-t border-[#ffffff]/5 bg-[#07101d]/80 px-4 py-1.5 text-[11px] font-mono text-[#718297]/60 select-none">
            {/* Left side: Git branch & status */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-[#D4AF37]/80 hover:text-[#D4AF37] cursor-pointer transition-colors">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M11.5 14a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-9-11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm3 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-3 1.25a2.75 2.75 0 0 1 2.75 2.75V11h-.75V8a2 2 0 0 0-2-2H4.25v1.25H2.5v-3.5h1.75V5h.25zm5 4.75a2.75 2.75 0 0 1 2.75-2.75H11.5V5h1.75v3.5H11.5V7.25h-.25a2 2 0 0 0-2 2v2a1.5 1.5 0 0 0 1.5 1.5h.75v.75h-.75A2.75 2.75 0 0 1 7.25 10v-3h.75v3z"/>
                </svg>
                <span className="font-semibold">main</span>
              </div>
              
              <div className="flex items-center space-x-1 text-emerald-400/80">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>No problems</span>
              </div>
            </div>

            {/* Right side: Line/Col info, Encoding, Lang */}
            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline">Ln 14, Col 2</span>
              <span className="hidden sm:inline">UTF-8</span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                JavaScript React
              </span>
            </div>
          </div>
        </div>
      </div>
    </SectionVisualFrame>
    </section>
  );
};

export default HeroSection;
