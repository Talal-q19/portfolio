// @flow strict

import { personalData } from "@/utils/data/personal-data";
import Image from "next/image";
import SectionVisualFrame from "../../helper/section-visual-frame";


function AboutSection() {
  return (
    <SectionVisualFrame id="about" variant="about" accent="cyan" sectionTitle="About" sectionIndex="01" className="my-12 lg:my-16 relative rounded-lg py-2">
      <div className="hidden lg:flex flex-col items-center absolute top-16 -right-8">
        <span className="bg-[#151515] w-fit text-[#f4f1e8] rotate-90 p-2 px-5 font-mono text-sm uppercase tracking-[0.14em] rounded-md">
          ABOUT ME
        </span>
        <span className="h-36 w-px bg-[#262626]"></span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        <div className="order-2 lg:order-1">
          <p className="mb-5 font-mono text-sm font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
            Who I am?
          </p>
          <p className="text-gray-200 text-sm lg:text-lg">
            {personalData.description}
          </p>
        </div>
        <div className="flex justify-center order-1 lg:order-2">
          <div className="profile-command-frame group relative aspect-square w-[min(72vw,280px)] sm:w-[280px]">
            <div className="relative h-full overflow-hidden rounded-lg border border-[#262626] bg-[#07101d] shadow-[0_24px_80px_rgba(0,0,0,0.36)] transition-all duration-500 lg:group-hover:border-[#D4AF37]/55 lg:group-hover:shadow-[0_28px_90px_rgba(212,175,55,0.14)]">
              <Image
                src={personalData.profile}
                fill
                sizes="(min-width: 640px) 280px, 72vw"
                alt="Talal Qasim"
                className="rounded-lg object-cover object-center transition-transform duration-700 lg:group-hover:scale-105"
              />
              <div aria-hidden="true" className="profile-scan-overlay absolute inset-0 pointer-events-none" />
              <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#07101d]/90 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </SectionVisualFrame>
  );
};

export default AboutSection;
