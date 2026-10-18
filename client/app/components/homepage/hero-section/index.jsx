"use client";

// @flow strict

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BsGithub, BsLinkedin } from "react-icons/bs";
import { FaInstagram } from "react-icons/fa";
import { MdDownload } from "react-icons/md";
import { RiContactsFill } from "react-icons/ri";
import { FiArrowDownRight, FiMaximize2, FiMinus, FiX } from "react-icons/fi";
import { useReducedMotion } from "../../../hooks/use-reduced-motion";
import SectionVisualFrame from "../../helper/section-visual-frame";
import GalaxyBackground from "../galaxy-background";

function WindowControl({ label, color, children, onClick, pressed }) {
  const fallbackIcon = label.startsWith("Expand") ? <FiMaximize2 size={8} /> : null;

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={`group flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-extrabold leading-none transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-1 focus:ring-white/40 lg:h-4 lg:w-4 lg:text-[9px] ${color}`}
    >
      <span className="translate-y-[-0.2px] opacity-25 transition-opacity duration-200 group-hover:opacity-100">
        {children || fallbackIcon}
      </span>
    </button>
  );
}

function CodingWindow({ hero, isMinimized, isExpanded, onClose, onMinimize, onExpand }) {
  const [activeTab, setActiveTab] = useState(hero.panels?.[0]?.title || "");
  const [typedCharacters, setTypedCharacters] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const currentLines = useMemo(() => {
    const tones = { default: "text-slate-200", muted: "text-gray-400", green: "text-[#34D399]", cyan: "text-[#64D8FF]", orange: "text-orange-400", purple: "text-purple-400", white: "text-white" };
    const panel = hero.panels?.find(p => p.title === activeTab) || hero.panels?.[0];
    return (panel?.lines || []).map(line => line.tokens.map(token => ({ text: token.text || "", className: tones[token.tone] || tones.default })));
  }, [activeTab, hero.panels]);

  const totalCharacters = useMemo(() => {
    return currentLines.reduce((total, line) => (
      total + line.reduce((lineTotal, token) => lineTotal + token.text.length, 0)
    ), 0);
  }, [currentLines]);

  useEffect(() => {
    setTypedCharacters(0);
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
    }, 22);

    return () => window.clearInterval(interval);
  }, [totalCharacters, activeTab]);

  const renderTypedLine = (line, lineIndex) => {
    const charactersBeforeLine = currentLines
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
        key={`code-line-${activeTab}-${lineIndex}`}
        className={`code-type-line flex items-start px-2.5 sm:px-4 lg:px-8 py-0.5 border-l-2 transition-colors duration-150 ${isCursorLine
          ? "bg-[#E2E8F0]/10 border-[#E2E8F0]/70"
          : "border-transparent hover:bg-white/[0.02]"
          }`}
      >
        <span className="font-mono text-[11px] sm:text-xs md:text-sm lg:text-[14px] select-none text-right mr-2 sm:mr-4 md:mr-6 w-6 sm:w-8 text-[#718297]/50 shrink-0 font-medium whitespace-nowrap">
          {lineIndex + 1}
        </span>
        <div className="flex-grow font-mono text-[11px] sm:text-xs md:text-sm lg:text-[14px] leading-relaxed whitespace-pre-wrap">
          {line.map((token, tokenIndex) => {
            const visibleText = token.text.slice(0, remainingCharacters);
            remainingCharacters = Math.max(0, remainingCharacters - token.text.length);

            if (!visibleText) {
              return null;
            }

            return (
              <span key={`code-token-${activeTab}-${lineIndex}-${tokenIndex}`} className={token.className}>
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
    <div className={`ufo-panel order-1 lg:order-2 relative overflow-hidden rounded-2xl bg-[#07101d]/50 backdrop-blur-xl border transition-all duration-500 ${isExpanded
      ? 'border-[#E2E8F0]/70 shadow-[0_16px_50px_rgba(226,232,240,0.2)] lg:scale-105 z-20'
      : 'border-[#ffffff]/10 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-[#E2E8F0]/40 hover:shadow-[0_16px_48px_rgba(226,232,240,0.12)]'
      }`}>
      {/* Top border decoration */}
      <div className="flex flex-row">
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#E2E8F0]/60 to-[#94A3B8]/60"></div>
        <div className="h-[1px] w-full bg-gradient-to-r from-[#94A3B8]/60 to-transparent"></div>
      </div>

      {/* Window Header */}
      <div className="flex items-center justify-between border-b border-[#ffffff]/10 bg-[#07101d]/80 px-3 sm:px-4 py-2.5 sm:py-3 relative gap-2">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1 overflow-hidden">
          {/* Windows control dots */}
          <div className="flex flex-row space-x-1.5 lg:space-x-2 shrink-0">
            <WindowControl
              label="Close coder preview"
              color="bg-[#FF5F56] text-[#4C0002]"
              onClick={onClose}
              pressed={false}
            >
              <FiX size={8} />
            </WindowControl>
            <WindowControl
              label="Minimize coder preview"
              color="bg-[#FFBD2E] text-[#5C3E00]"
              onClick={onMinimize}
              pressed={isMinimized}
            >
              <FiMinus size={8} />
            </WindowControl>
            <WindowControl
              label="Expand coder preview"
              color="bg-[#27C93F] text-[#004D0B]"
              onClick={onExpand}
              pressed={isExpanded}
            />
          </div>

          {/* Interactive File Tabs - Horizontally scrollable on mobile */}
          <div className="flex items-center space-x-1 sm:space-x-2 pl-2 sm:pl-4 border-l border-[#ffffff]/10 overflow-x-auto no-scrollbar py-0.5 flex-nowrap shrink max-w-full">
            {(hero.panels || []).map((panel, index) => <button
              key={`${panel.title}-${index}`} type="button" onClick={() => setActiveTab(panel.title)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 font-mono text-xs transition-all ${activeTab === panel.title ? "border border-[#E2E8F0]/40 bg-[#07101d] text-[#E2E8F0]" : "text-[#718297] hover:text-white"}`}>
              <span>{panel.title}</span>
            </button>)}
          </div>
        </div>

        {/* Orbital Online Indicator */}
        <div aria-hidden="true" className="relative flex items-center gap-1.5 rounded-full border border-[#E2E8F0]/35 bg-[#07101d]/90 px-2 sm:px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] sm:tracking-[0.22em] text-[#E2E8F0] shadow-[0_0_15px_rgba(226,232,240,0.2)] select-none shrink-0">
          <span className="relative flex h-2 w-2 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E2E8F0] opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#E2E8F0]"></span>
          </span>
          <span className="hidden sm:inline">Signal online</span>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${isMinimized ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
        }`}>
        <div className="overflow-hidden">
          {/* Dynamic Breadcrumbs bar */}
          <div className="flex items-center space-x-2 border-b border-[#ffffff]/5 bg-[#07101d]/30 px-4 py-1.5 text-xs font-mono text-[#718297]/70">
            <span>{activeTab === "skills.json" ? "config" : activeTab === "README.md" ? "root" : "src"}</span>
            <span>&gt;</span>
            <span>{activeTab === "skills.json" ? "env" : activeTab === "README.md" ? "docs" : "components"}</span>
            <span>&gt;</span>
            <span className="text-[#f4f1e8] font-medium flex items-center gap-1">
              {activeTab}
            </span>
          </div>

          {/* Editor Body */}
          <div className="overflow-hidden py-4 lg:py-6 bg-[#07101d]/30 min-h-[280px]">
            <code className="block font-mono leading-relaxed" aria-label="Animated code introduction">
              {currentLines.map(renderTypedLine)}
            </code>
          </div>

          {/* Interactive Simulated Terminal Prompt Bar */}
          <div className="border-t border-[#ffffff]/10 bg-[#040812]/95 px-4 py-2 font-mono text-xs flex items-center justify-between text-[#94A3B8] select-none">
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
              <span className="text-[#34D399] font-bold">❯</span>
              <span className="text-[#64D8FF]">Talal.getAvailability()</span>
              <span className="text-slate-400">=&gt;</span>
              <span className="text-[#E2E8F0] font-semibold whitespace-nowrap">{hero.availability}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#34D399] bg-[#34D399]/10 px-2 py-0.5 rounded border border-[#34D399]/25 font-bold uppercase tracking-wider shrink-0 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]"></span>
              200 OK
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between border-t border-[#ffffff]/5 bg-[#07101d]/85 px-4 py-1.5 text-[11px] font-mono text-[#718297]/70 select-none">
            {/* Left side: Git branch & status */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-[#E2E8F0]/90 hover:text-[#E2E8F0] cursor-pointer transition-colors">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M11.5 14a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-9-11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm3 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-3 1.25a2.75 2.75 0 0 1 2.75 2.75V11h-.75V8a2 2 0 0 0-2-2H4.25v1.25H2.5v-3.5h1.75V5h.25zm5 4.75a2.75 2.75 0 0 1 2.75-2.75H11.5V5h1.75v3.5H11.5V7.25h-.25a2 2 0 0 0-2 2v2a1.5 1.5 0 0 0 1.5 1.5h.75v.75h-.75A2.75 2.75 0 0 1 7.25 10v-3h.75v3z" />
                </svg>
                <span className="font-semibold">main</span>
              </div>

              <div className="flex items-center space-x-1 text-emerald-400">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>No problems</span>
              </div>
            </div>

            {/* Right side: Line/Col info, Encoding, Lang */}
            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline">Ln {currentLines.length}, Col 2</span>
              <span className="hidden sm:inline">UTF-8</span>
              <span className="flex items-center gap-1 text-[#64D8FF]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#64D8FF] animate-pulse"></span>
                {activeTab === "skills.json" ? "JSON" : activeTab === "README.md" ? "Markdown" : "JavaScript React"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isMinimized && (
        <div className="border-t border-[#262626]/30 px-4 py-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#718297]/60 bg-[#07101d]/40">
          Minimized
        </div>
      )}
    </div>
  );
}

function HeroSection({ personalData, hero }) {
  const [isClosed, setIsClosed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRestore = () => {
    setIsClosed(false);
    setIsMinimized(false);
    setIsExpanded(false);
  };

  return (
    <section className="relative w-full">
      <GalaxyBackground />
      <SectionVisualFrame id="about" variant="hero" accent="emerald" className="hero-space relative flex min-h-[calc(100svh-var(--nav-safe-top))] flex-col items-center justify-center py-8 lg:py-12">
        <div className="relative z-10 grid grid-cols-1 items-start gap-y-8 lg:grid-cols-2 lg:gap-12 w-full">
          <div className="order-2 lg:order-1 flex flex-col items-start justify-center p-2 pb-20 md:pb-10 lg:pt-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 mb-6">
              <div className="ufo-panel group relative aspect-square w-32 sm:w-44 shrink-0 rounded-full border border-[#E2E8F0]/40 p-1.5 shadow-[0_0_30px_rgba(226,232,240,0.15)] transition-all duration-500 hover:shadow-[0_0_50px_rgba(226,232,240,0.25)] hover:border-[#E2E8F0]/80">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E2E8F0]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="relative h-full overflow-hidden rounded-full border border-[#ffffff]/10 bg-[#07101d] shadow-inner transition-all duration-500">
                  <Image
                    src={personalData.profile}
                    fill
                    sizes="(min-width: 640px) 176px, 128px"
                    alt={personalData.name}
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
              </div>
              <div>
                <p className="mb-3 font-mono text-[0.68rem] font-bold uppercase tracking-[0.3em] sm:text-xs">
                  <span className="text-[#f4f1e8]">{hero.eyebrow}</span>
                  <span className="text-zinc-500 mx-1.5">·</span>
                  <span className="text-[#34D399]">{hero.location}</span>
                </p>
                <h1 className="text-4xl font-semibold leading-[1.1] md:text-5xl lg:text-[3.6rem] tracking-tight max-w-3xl flex flex-col items-start">
                  <span className="inline-block w-fit bg-gradient-to-r from-white via-[#A7F3D0] via-45% to-[#34D399] bg-clip-text text-transparent">
                    {hero.heading}
                  </span>
                  <span className="inline-block w-fit text-2xl md:text-4xl lg:text-[2.8rem] bg-gradient-to-r from-white via-[#6EE7B7] via-40% to-[#10B981] bg-clip-text text-transparent mt-2 md:mt-3">
                    {hero.role}
                  </span>
                </h1>
              </div>
            </div>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#a8b4c3]/90 md:text-lg font-light tracking-wide">
              {personalData.description}
            </p>

            <div className="my-12 flex items-center gap-6">
              <Link
                href={personalData.github || "#contact"}
                target='_blank'
                aria-label="GitHub profile"
                className="group flex h-12 w-12 items-center justify-center rounded-full border border-[#ffffff]/10 bg-[#07101d]/50 backdrop-blur-sm text-[#a8b4c3] transition-all duration-300 hover:border-[#E2E8F0]/60 hover:text-[#E2E8F0] hover:scale-110 hover:shadow-[0_0_20px_rgba(226,232,240,0.2)]"
              >
                <BsGithub size={24} className="transition-transform duration-300 group-hover:scale-110" />
              </Link>
              <Link
                href={personalData.linkedIn || "#contact"}
                target='_blank'
                aria-label="LinkedIn profile"
                className="group flex h-12 w-12 items-center justify-center rounded-full border border-[#ffffff]/10 bg-[#07101d]/50 backdrop-blur-sm text-[#a8b4c3] transition-all duration-300 hover:border-[#E2E8F0]/60 hover:text-[#E2E8F0] hover:scale-110 hover:shadow-[0_0_20px_rgba(226,232,240,0.2)]"
              >
                <BsLinkedin size={24} className="transition-transform duration-300 group-hover:scale-110" />
              </Link>
              <Link
                href={personalData.instagram || "#contact"}
                target='_blank'
                aria-label="Instagram profile"
                className="group flex h-12 w-12 items-center justify-center rounded-full border border-[#ffffff]/10 bg-[#07101d]/50 backdrop-blur-sm text-[#a8b4c3] transition-all duration-300 hover:border-[#E2E8F0]/60 hover:text-[#E2E8F0] hover:scale-110 hover:shadow-[0_0_20px_rgba(226,232,240,0.2)]"
              >
                <FaInstagram size={24} className="transition-transform duration-300 group-hover:scale-110" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {(hero.buttons || []).map((button, index) => <Link key={`${button.label}-${index}`} href={button.url}
                className={`group flex min-h-[50px] items-center gap-2 rounded-full px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 md:px-8 ${index === 2 ? "bg-gradient-to-r from-white via-[#E2E8F0] to-[#CBD5E1] text-[#07101d] hover:scale-105" : index === 1 ? "border border-[#64d8ff]/40 bg-[#64d8ff]/10 text-[#c6f1ff] hover:border-[#64d8ff]" : "border border-[#E2E8F0]/40 bg-[#07101d]/60 text-[#f4f1e8] hover:border-[#E2E8F0]"}`}>
                <span>{button.label}</span>
                {index === 0 ? <RiContactsFill size={16} /> : index === 1 ? <FiArrowDownRight size={16} /> : <MdDownload size={16} />}
              </Link>)}
            </div>

          </div>

          {/* Column 2: Code Window or Closed Placeholder */}
          {isClosed ? (
            <div className="order-1 lg:order-2 flex items-center justify-center py-8 w-full">
              <button
                onClick={handleRestore}
                type="button"
                className="bg-transparent font-mono text-[11px] md:text-xs text-slate-500 hover:text-[#E2E8F0] cursor-pointer transition-colors duration-300 focus:outline-none flex items-center gap-2"
              >
                <span className="text-[#E2E8F0] font-bold animate-pulse">&gt;</span>
                <span>restore-coder.sh</span>
              </button>
            </div>
          ) : (
            <CodingWindow
              hero={hero}
              isMinimized={isMinimized}
              isExpanded={isExpanded}
              onClose={() => setIsClosed(true)}
              onMinimize={() => setIsMinimized(!isMinimized)}
              onExpand={() => {
                setIsExpanded(!isExpanded);
                setIsMinimized(false);
              }}
            />
          )}
        </div>
      </SectionVisualFrame>
    </section>
  );
}

export default HeroSection;
