"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IoClose, IoMenu } from "react-icons/io5";

const NAV_ITEMS = [
  { label: "ABOUT", target: "about" },
  { label: "EXPERIENCE", target: "experience" },
  { label: "SKILLS", target: "skills" },
  { label: "PROJECTS", target: "projects" },
  { label: "EDUCATION", target: "education" },
  { label: "CONTACT", target: "contact" },
];

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 24);

      const isAtPageBottom = window.innerHeight + scrollPosition >= document.documentElement.scrollHeight - 8;

      if (isAtPageBottom) {
        setActiveSection(NAV_ITEMS[NAV_ITEMS.length - 1].target);
        return;
      }

      const currentSection = [...NAV_ITEMS].reverse().find(({ target }) => {
        const section = document.getElementById(target);

        if (!section) {
          return false;
        }

        const rect = section.getBoundingClientRect();
        return rect.top <= 150;
      });

      setActiveSection(currentSection?.target || "");
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (event, target) => {
    event.preventDefault();
    setIsMenuOpen(false);

    if (window.location.pathname !== "/") {
      window.location.href = `/#${target}`;
      return;
    }

    const section = document.getElementById(target);

    if (!section) {
      return;
    }

    const navOffset = 112;
    const top = section.getBoundingClientRect().top + window.scrollY - navOffset;

    window.scrollTo({
      top,
      behavior: "smooth",
    });

    window.history.pushState(null, "", `/#${target}`);
    setActiveSection(target);
  };

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-[100] border-b border-[#16f2b3]/10 bg-[#0d1224] transition-all duration-500 ${
        isScrolled
          ? "shadow-[0_10px_34px_rgba(13,18,36,0.82)]"
          : "shadow-[0_10px_40px_rgba(3,7,18,0.35)]"
      }`}
    >
      <div className="mx-auto flex max-w-[92rem] items-center justify-between px-6 py-4 sm:px-12 lg:max-w-[70rem] xl:max-w-[76rem] 2xl:max-w-[92rem]">
        <div className="flex flex-shrink-0 items-center">
          <Link
            href="/"
            className="text-xl font-bold text-[#16f2b3] no-underline transition-all duration-300 hover:text-white hover:drop-shadow-[0_0_14px_rgba(22,242,179,0.9)] sm:text-3xl"
          >
            Talal Qasim
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#16f2b3]/25 bg-[#080b18]/70 text-[#16f2b3] transition-all duration-300 hover:border-[#16f2b3]/60 hover:bg-[#16f2b3]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16f2b3] lg:hidden"
          aria-controls="navbar-mobile"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {isMenuOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
        </button>

        <ul
          className={`hidden items-center rounded-lg p-1 text-sm transition-all duration-500 lg:flex ${
            isScrolled
              ? "border border-white/5 bg-transparent shadow-none"
              : "border border-white/5 bg-[#080b18]/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          }`}
          id="navbar-default"
        >
          {NAV_ITEMS.map(({ label, target }) => {
            const isActive = activeSection === target;

            return (
              <li key={target}>
                <Link
                  className={`block rounded-md px-4 py-2 text-xs font-semibold tracking-[0.08em] no-underline outline-none transition-all duration-300 hover:border-[#16f2b3]/50 hover:bg-[#16f2b3]/10 hover:text-[#16f2b3] hover:shadow-[0_0_22px_rgba(22,242,179,0.42)] focus-visible:border-[#16f2b3] focus-visible:bg-[#16f2b3]/10 focus-visible:text-[#16f2b3] ${
                    isActive
                      ? "border border-[#16f2b3]/45 bg-[#16f2b3]/10 text-[#16f2b3] shadow-[0_0_18px_rgba(22,242,179,0.35)]"
                      : "border border-transparent text-white"
                  }`}
                  href={`/#${target}`}
                  onClick={(event) => scrollToSection(event, target)}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div
        className={`mx-6 overflow-hidden rounded-lg border border-[#16f2b3]/15 bg-[#080b18]/95 shadow-[0_18px_40px_rgba(3,7,18,0.62)] transition-all duration-300 sm:mx-12 lg:hidden ${
          isMenuOpen
            ? "mb-4 max-h-96 opacity-100"
            : "max-h-0 border-transparent opacity-0"
        }`}
        id="navbar-mobile"
      >
        <ul className="grid grid-cols-2 gap-2 p-3 text-sm">
          {NAV_ITEMS.map(({ label, target }) => {
            const isActive = activeSection === target;

            return (
              <li key={target}>
                <Link
                  className={`block rounded-md border px-3 py-3 text-center text-xs font-semibold tracking-[0.08em] no-underline outline-none transition-all duration-300 focus-visible:border-[#16f2b3] focus-visible:bg-[#16f2b3]/10 focus-visible:text-[#16f2b3] ${
                    isActive
                      ? "border-[#16f2b3]/45 bg-[#16f2b3]/10 text-[#16f2b3] shadow-[0_0_18px_rgba(22,242,179,0.28)]"
                      : "border-white/5 text-white"
                  }`}
                  href={`/#${target}`}
                  onClick={(event) => scrollToSection(event, target)}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
