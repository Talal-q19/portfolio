// @flow strict
import { personalData } from '@/utils/data/personal-data';
import Link from 'next/link';
import { BiLogoLinkedin } from "react-icons/bi";
import { CiLocationOn } from "react-icons/ci";
import { FaInstagram } from "react-icons/fa";
import { IoLogoGithub, IoMdCall } from "react-icons/io";
import { MdAlternateEmail } from "react-icons/md";
import SectionVisualFrame from '../../helper/section-visual-frame';
import ContactForm from './contact-form';

function ContactSection() {
  return (
    <SectionVisualFrame id="contact" variant="contact" accent="emerald" className="my-12 lg:my-16 relative mt-24 text-white border-t border-[#262626]">
      <div className="hidden lg:flex flex-col items-center absolute top-24 -right-8">
        <span className="w-fit rotate-90 rounded-md bg-[#151515] p-2 px-5 font-mono text-sm font-bold uppercase tracking-[0.14em] text-[#f4f1e8]">
          CONTACT
        </span>
        <span className="h-36 w-px bg-[#262626]"></span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <ContactForm />
        <div className="lg:w-3/4 ">
          <div className="contact-radar relative mb-8 hidden h-44 w-full max-w-md items-center justify-center lg:flex">
            <svg aria-hidden="true" className="absolute inset-0 h-full w-full text-[#E2E8F0]" viewBox="0 0 420 180">
              <circle className="contact-radar__ring" cx="210" cy="90" r="34" fill="none" stroke="currentColor" strokeOpacity="0.42" />
              <circle className="contact-radar__ring" cx="210" cy="90" r="68" fill="none" stroke="currentColor" strokeOpacity="0.24" />
              <circle className="contact-radar__ring" cx="210" cy="90" r="102" fill="none" stroke="currentColor" strokeOpacity="0.14" />
              <path d="M210 90 H356 M210 90 L94 38 M210 90 L104 144" fill="none" stroke="currentColor" strokeOpacity="0.36" />
              <circle cx="210" cy="90" r="5" fill="currentColor" />
              <circle cx="356" cy="90" r="4" fill="currentColor" />
              <circle cx="94" cy="38" r="4" fill="currentColor" />
              <circle cx="104" cy="144" r="4" fill="currentColor" />
            </svg>
            <div className="relative rounded-full border border-[#34D399]/30 bg-[#07101d]/80 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#34D399]">
              Available for contact
            </div>
          </div>
          <div className="flex flex-col gap-5 lg:gap-9">
            <p className="text-sm md:text-xl flex items-center gap-3">
              <MdAlternateEmail
                className="cursor-pointer rounded-full bg-[#262626] p-2 text-[#d8e0e8] transition-all duration-300 hover:bg-[#E2E8F0] hover:text-[#07101d]"
                size={36}
              />
              <span>{personalData.email}</span>
            </p>
            <p className="text-sm md:text-xl flex items-center gap-3">
              <IoMdCall
                className="cursor-pointer rounded-full bg-[#262626] p-2 text-[#d8e0e8] transition-all duration-300 hover:bg-[#E2E8F0] hover:text-[#07101d]"
                size={36}
              />
              <span>
                {personalData.phone}
              </span>
            </p>
            <p className="text-sm md:text-xl flex items-center gap-3">
              <CiLocationOn
                className="cursor-pointer rounded-full bg-[#262626] p-2 text-[#d8e0e8] transition-all duration-300 hover:bg-[#E2E8F0] hover:text-[#07101d]"
                size={36}
              />
              <span>
                {personalData.address}
              </span>
            </p>
          </div>
          <div className="mt-8 lg:mt-16 flex items-center gap-5 lg:gap-10">
            <Link target="_blank" href={personalData.github}>
              <IoLogoGithub
                className="cursor-pointer rounded-full bg-[#262626] p-3 text-[#d8e0e8] transition-all duration-300 hover:bg-[#E2E8F0] hover:text-[#07101d]"
                size={48}
              />
            </Link>
            <Link target="_blank" href={personalData.linkedIn}>
              <BiLogoLinkedin
                className="cursor-pointer rounded-full bg-[#262626] p-3 text-[#d8e0e8] transition-all duration-300 hover:bg-[#E2E8F0] hover:text-[#07101d]"
                size={48}
              />
            </Link>
            <Link target="_blank" href={personalData.instagram}>
              <FaInstagram
                className="cursor-pointer rounded-full bg-[#262626] p-3 text-[#d8e0e8] transition-all duration-300 hover:bg-[#E2E8F0] hover:text-[#07101d]"
                size={48}
              />
            </Link>
          </div>
        </div>
      </div>
    </SectionVisualFrame>
  );
};

export default ContactSection;
