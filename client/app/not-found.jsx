// @flow strict

import Link from "next/link";

function page() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-100">404</h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Page Not Found</p>
      <p className="mt-2 text-gray-500 dark:text-gray-400">Sorry, the page you are looking for does not exist.</p>
      <Link className="mt-5 flex min-h-11 items-center gap-2 rounded-full bg-[#ffcf70] px-5 py-3 text-center font-mono text-xs font-bold uppercase tracking-[0.13em] text-[#07101d] no-underline transition-colors duration-200 hover:bg-[#ffe1a3] md:px-8"
        role="button" 
        href="/"
      >
        Go to Home
      </Link>
    </div>
  );
};

export default page;
