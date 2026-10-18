// @flow strict
import Link from 'next/link';

function Footer() {
  return (
    <div className="relative border-t border-[#262626] bg-[#050505] text-[#a8b4c3]">
      <div className="mx-auto px-6 sm:px-12 lg:max-w-[70rem] xl:max-w-[76rem] 2xl:max-w-[92rem] py-6 lg:py-10">
        <div className="flex justify-center -z-40">
          <div className="absolute top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-[#E2E8F0]/40 to-transparent"></div>
        </div>
        <div className="flex items-center justify-center text-center">
          <p className="text-sm">
            &copy; Portfolio by <Link target="_blank" href="https://www.linkedin.com/in/talal-q-b8622b203" className="text-[#E2E8F0] hover:text-[#94A3B8] transition-colors duration-300 font-medium">Talal Qasim</Link>
          </p>
        </div>
      </div>
    </div >
  );
};

export default Footer;
