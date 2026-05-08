"use client";

// @flow strict

import { skillCategories } from "@/utils/data/skills";
import { skillsImage } from "@/utils/skill-image";
import Image from "next/image";
import { useMemo, useState } from "react";
import Marquee from "react-fast-marquee";

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

function Skills() {
  const [activeSlide, setActiveSlide] = useState(0);
  const activeCategory = skillCategories[activeSlide];
  const activeAccent = accentStyles[activeCategory.accent];

  const marqueeSkills = useMemo(() => {
    return [...activeCategory.skills, ...activeCategory.skills];
  }, [activeCategory]);

  return (
    <div id="skills" className="relative z-50 border-t my-12 lg:my-24 border-[#25213b]">
      <div className={`absolute left-1/2 top-10 h-28 w-2/3 -translate-x-1/2 bg-gradient-to-r ${activeAccent.glow} blur-3xl opacity-70`} />

      <div className="flex justify-center -translate-y-[1px]">
        <div className="w-3/4">
          <div className={`h-[1px] bg-gradient-to-r from-transparent ${activeAccent.line} to-transparent w-full`} />
        </div>
      </div>

      <div className="flex justify-center my-5 lg:py-8">
        <div className="flex  items-center">
          <span className="w-24 h-[2px] bg-[#1a1443]"></span>
          <span className="bg-[#1a1443] w-fit text-white p-2 px-5 text-xl rounded-md">
            Skills
          </span>
          <span className="w-24 h-[2px] bg-[#1a1443]"></span>
        </div>
      </div>

      <div className="my-10 overflow-hidden rounded-lg border border-[#252a46] bg-[#0f1428]/80 p-4 shadow-2xl shadow-black/20 sm:p-6 lg:my-12">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className={`inline-flex rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${activeAccent.badge}`}>
              {activeCategory.eyebrow}
            </span>
            <div className="mt-3 flex items-baseline gap-3">
              <p className="text-sm font-semibold text-[#8f98c2]">
                0{activeSlide + 1}/0{skillCategories.length}
              </p>
              <h3 className={`text-2xl font-semibold sm:text-3xl ${activeAccent.title}`}>
                {activeCategory.title}
              </h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#d3d8e8] sm:text-base">
              {activeCategory.description}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg border border-[#252a46] bg-[#0b1022] p-1">
            {skillCategories.map((category, index) => {
              const isActive = index === activeSlide;

              return (
                <button
                  key={category.title}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={`rounded-md px-3 py-2 text-xs font-semibold uppercase transition-all duration-300 sm:text-sm ${
                    isActive
                      ? `${accentStyles[category.accent].badge} shadow-lg shadow-black/20`
                      : "text-[#9ba3c7] hover:bg-[#151a32] hover:text-white"
                  }`}
                  aria-pressed={isActive}
                >
                  {category.title}
                </button>
              );
            })}
          </div>
        </div>

        <div key={activeCategory.title} className="skill-slide-panel">
          <div className={`mb-1 h-[1px] w-full bg-gradient-to-r from-transparent ${activeAccent.line} to-transparent opacity-80`} />
          <Marquee
            gradient={false}
            speed={activeCategory.title === "Backend" ? 78 : 68}
            pauseOnHover={true}
            pauseOnClick={true}
            delay={0}
            play={true}
            direction={activeSlide === 1 ? "right" : "left"}
          >
            {marqueeSkills.map((skill, id) => (
              <div
                className="w-32 min-w-fit h-fit flex flex-col items-center justify-center transition-all duration-500 m-2 sm:m-4 rounded-lg group relative hover:scale-[1.12] cursor-pointer"
                key={id}
              >
                <div className="h-full w-full rounded-lg border border-[#1f223c] bg-[#11152c] shadow-none shadow-gray-50 group-hover:border-white/40 transition-all duration-500">
                  <div className="flex -translate-y-[1px] justify-center">
                    <div className="w-3/4">
                      <div className={`h-[1px] w-full bg-gradient-to-r from-transparent ${activeAccent.line} to-transparent`} />
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-3 p-5 sm:p-6">
                    <div className="h-8 sm:h-10">
                      <Image
                        src={skillsImage(skill)?.src}
                        alt={skill}
                        width={40}
                        height={40}
                        className="h-full w-auto rounded-lg"
                      />
                    </div>
                    <p className="text-white text-sm sm:text-lg">
                      {skill}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </Marquee>
        </div>
      </div>
    </div>
  );
};

export default Skills;
