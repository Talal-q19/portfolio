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
import Galaxy from "../../reactbits/galaxy";

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
      <div key={`code-line-${lineIndex}`} className="code-type-line">
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
    );
  };

  return (
    <SectionVisualFrame variant="hero" accent="emerald" className="hero-space relative flex min-h-[calc(100svh-var(--nav-safe-top))] flex-col items-center justify-center py-8 lg:py-12">
      <div aria-hidden="true" className="absolute inset-x-[calc(50%-50vw)] inset-y-0 -z-20 overflow-hidden">
        <Galaxy
          density={0.82}
          disableAnimation={prefersReducedMotion}
          glowIntensity={0.2}
          hueShift={188}
          mouseInteraction={!prefersReducedMotion}
          saturation={0.35}
          speed={0.55}
          starSpeed={0.32}
          twinkleIntensity={0.16}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#03060d_0%,rgba(3,6,13,0.72)_38%,rgba(3,6,13,0.28)_67%,#03060d_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#03060d] to-transparent" />
      </div>

      <div className="relative z-10 grid grid-cols-1 items-start gap-y-8 lg:grid-cols-2 lg:gap-12">
        <div className="order-2 lg:order-1 flex flex-col items-start justify-center p-2 pb-20 md:pb-10 lg:pt-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
            <div className="profile-command-frame group relative aspect-square w-32 sm:w-40 shrink-0">
              <div className="relative h-full overflow-hidden rounded-2xl border border-[#262626] bg-[#07101d] shadow-[0_24px_80px_rgba(0,0,0,0.36)] transition-all duration-500 hover:border-[#D4AF37]/55">
                <Image
                  src={personalData.profile}
                  fill
                  sizes="(min-width: 640px) 160px, 128px"
                  alt="Talal Qasim"
                  className="object-cover object-center transition-transform duration-700 hover:scale-105"
                />
                <div aria-hidden="true" className="profile-scan-overlay absolute inset-0 pointer-events-none" />
              </div>
            </div>
            <div>
              <p className="mb-3 font-mono text-[0.68rem] font-bold uppercase tracking-[0.3em] text-[#D4AF37] sm:text-xs">
                Backend engineering · Dubai
              </p>
              <h1 className="max-w-[14ch] text-4xl font-semibold leading-[1.08] text-[#f4f1e8] md:text-5xl lg:text-[3.6rem]">
                Systems built for the <span className="text-[#F59E0B]">real world.</span>
              </h1>
            </div>
          </div>
          <p className="mt-2 max-w-xl text-base leading-7 text-[#a8b4c3] md:text-lg">
            {personalData.description}
          </p>

          <div className="my-12 flex items-center gap-5">
            <Link
              href={personalData.github}
              target='_blank'
              aria-label="GitHub profile"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#262626] bg-[#07101d]/80 text-[#a8b4c3] transition-all duration-300 hover:border-[#D4AF37]/60 hover:text-[#D4AF37]"
            >
              <BsGithub size={30} />
            </Link>
            <Link
              href={personalData.linkedIn}
              target='_blank'
              aria-label="LinkedIn profile"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#262626] bg-[#07101d]/80 text-[#a8b4c3] transition-all duration-300 hover:border-[#D4AF37]/60 hover:text-[#D4AF37]"
            >
              <BsLinkedin size={30} />
            </Link>
            <Link
              href={personalData.instagram}
              target='_blank'
              aria-label="Instagram profile"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#262626] bg-[#07101d]/80 text-[#a8b4c3] transition-all duration-300 hover:border-[#D4AF37]/60 hover:text-[#D4AF37]"
            >
              <FaInstagram size={30} />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="#contact" className="flex min-h-11 items-center gap-2 rounded-full border border-[#D4AF37]/55 bg-[#07101d]/85 px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.13em] text-[#f4f1e8] transition-all duration-200 hover:bg-[#D4AF37]/10 md:px-7">
              <span>Contact me</span>
              <RiContactsFill size={16} />
            </Link>

            <Link className="flex min-h-11 items-center gap-2 rounded-full bg-[#F59E0B] px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.13em] text-[#07101d] transition-all duration-200 hover:bg-[#ffe1a3] md:px-7" role="button" target="_blank" href={personalData.resume}
            >
              <span>Get Resume</span>
              <MdDownload size={16} />
            </Link>
          </div>

        </div>
        <div className="ide-terminal-pulse order-1 lg:order-2 relative overflow-hidden rounded-xl border border-[#262626] bg-[#07101d]/90 shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-sm">
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[linear-gradient(115deg,transparent,rgba(100,216,255,0.06),transparent)] opacity-60" />
          <div aria-hidden="true" className="absolute right-4 top-4 hidden items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#07101d]/80 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_12px_rgba(100,216,255,0.85)]" />
            Signal online
          </div>
          <div className="flex flex-row">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-[#F59E0B]"></div>
            <div className="h-px w-full bg-gradient-to-r from-[#F59E0B] to-transparent"></div>
          </div>
          <div className="px-4 lg:px-8 py-5">
            <div className="flex flex-row space-x-2">
              <div className="h-3 w-3 rounded-full bg-red-400"></div>
              <div className="h-3 w-3 rounded-full bg-orange-400"></div>
              <div className="h-3 w-3 rounded-full bg-green-200"></div>
            </div>
          </div>
          <div className="overflow-hidden border-t border-[#262626] px-4 py-4 lg:px-8 lg:py-8">
            <code className="font-mono text-xs md:text-sm lg:text-base" aria-label="Animated code introduction">
              {codeLines.map(renderTypedLine)}
            </code>
          </div>
        </div>
      </div>
    </SectionVisualFrame>
  );
};

export default HeroSection;
