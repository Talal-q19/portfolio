// @flow strict

import { personalData } from "@/utils/data/personal-data";
import Image from "next/image";
import SectionVisualFrame from "../../helper/section-visual-frame";


function AboutSection() {
  return (
    <SectionVisualFrame id="about" variant="about" accent="cyan" className="my-12 lg:my-16 relative rounded-lg py-2">
      <div className="hidden lg:flex flex-col items-center absolute top-16 -right-8">
        <span className="bg-[#1a1443] w-fit text-white rotate-90 p-2 px-5 text-xl rounded-md">
          ABOUT ME
        </span>
        <span className="h-36 w-[2px] bg-[#1a1443]"></span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        <div className="order-2 lg:order-1">
          <p className="font-medium mb-5 text-[#16f2b3] text-xl uppercase">
            Who I am?
          </p>
          <p className="text-gray-200 text-sm lg:text-lg">
            {personalData.description}
          </p>
        </div>
        <div className="flex justify-center order-1 lg:order-2">
          <div className="profile-command-frame group relative">
            <div className="relative overflow-hidden rounded-lg border border-[#16f2b3]/20 bg-[#071323] shadow-[0_24px_80px_rgba(22,242,179,0.12)] transition-all duration-500 lg:group-hover:border-[#16f2b3]/60 lg:group-hover:shadow-[0_28px_90px_rgba(22,242,179,0.28)]">
              <Image
                src={personalData.profile}
                width={280}
                height={280}
                alt="Talal Qasim"
                className="rounded-lg transition-transform duration-700 lg:group-hover:scale-105"
              />
              <div aria-hidden="true" className="profile-scan-overlay absolute inset-0 pointer-events-none" />
              <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#071323]/90 to-transparent" />
            </div>
            <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 gap-2 whitespace-nowrap">
              {["Backend", "Systems", "APIs"].map((badge) => (
                <span key={badge} className="rounded-full border border-[#16f2b3]/30 bg-[#071323]/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#16f2b3] shadow-[0_0_18px_rgba(22,242,179,0.12)]">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionVisualFrame>
  );
};

export default AboutSection;
