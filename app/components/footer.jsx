// @flow strict
import Link from 'next/link';

function Footer() {
  return (
    <div className="relative border-t border-[#203247] bg-[#03060d] text-[#a8b4c3]">
      <div className="mx-auto px-6 sm:px-12 lg:max-w-[70rem] xl:max-w-[76rem] 2xl:max-w-[92rem] py-6 lg:py-10">
        <div className="flex justify-center -z-40">
          <div className="absolute top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-[#64d8ff]/60 to-transparent"></div>
        </div>
        <div className="flex items-center justify-center text-center">
          <p className="text-sm">
            &copy; Portfolio by <Link target="_blank" href="https://www.linkedin.com/in/talal-qasim-b8622b203" className="text-[#64d8ff]">Talal Qasim</Link>
          </p>
        </div>
      </div>
    </div >
  );
};

export default Footer;
