"use client";

import { useEffect, useState } from "react";
import GalaxyBackground from "../homepage/galaxy-background";

export default function Preloader() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bgLoaded, setBgLoaded] = useState(false);

  // Prevent scrolling while loading
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, [isVisible]);

  useEffect(() => {
    if (!bgLoaded) return; // Wait until the 3D background has loaded

    const duration = 2500; // 2.5 seconds total loading time
    const intervalTime = 20;
    const step = 100 / (duration / intervalTime);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Wait briefly at 100% before starting the fade-out
          setTimeout(() => setIsFading(true), 300);
          // Scroll to top so mobile opens at the hero, not mid-page
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 300);
          // Completely unmount after fade-out completes
          setTimeout(() => setIsVisible(false), 1100);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      clearInterval(interval);
    };
  }, [bgLoaded]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 overflow-hidden z-[9999] bg-[#050505] flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${
        isFading ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        <GalaxyBackground 
          onLoaded={() => setBgLoaded(true)} 
          count={1800} 
          speed={0.35} 
          size={0.0035} 
          opacity={0.45} 
          shootingStars={false}
        />
      </div>
      <style>{`
        @keyframes elegantShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes elegantFadeIn {
          0% { opacity: 0; filter: blur(10px); transform: translateY(10px); }
          100% { opacity: 1; filter: blur(0px); transform: translateY(0); }
        }
        .elegant-text-shimmer {
          background-size: 200% auto;
          animation: elegantShimmer 4s linear infinite;
        }
        .letter-t {
          animation: elegantFadeIn 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .letter-q {
          animation: elegantFadeIn 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          animation-delay: 0.3s;
          opacity: 0; /* initial state for animation */
        }
        .progress-glow {
          box-shadow: 0 0 15px rgba(52, 211, 153, 0.4), 0 0 30px rgba(52, 211, 153, 0.2);
        }
      `}</style>

      <div className="flex flex-col items-center justify-center w-full max-w-md px-6">
        {/* Elegant Initials */}
        <div className="relative flex items-center justify-center mb-16">
          {/* Subtle ambient glow */}
          <div className="absolute w-32 h-32 bg-white/5 rounded-full blur-[50px] pointer-events-none"></div>

          <div className="flex items-center -space-x-4">
            <span className="letter-t text-8xl sm:text-9xl font-serif font-light text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#E2E8F0] z-20">
              T
            </span>
            <span className="letter-q z-10 bg-gradient-to-r from-[#E2E8F0] via-[#f8fafc] to-[#CBD5E1] bg-clip-text font-mono text-8xl font-light text-transparent opacity-95 mix-blend-screen sm:text-9xl">
              Q
            </span>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full sm:w-80 h-[2px] bg-[#151515] rounded-full overflow-hidden relative">
          {/* Progress Bar Fill */}
          <div
            className="relative h-full bg-gradient-to-r from-white via-[#A7F3D0] to-[#34D399] transition-all duration-[20ms] ease-linear progress-glow"
            style={{ width: `${progress}%` }}
          >
            {/* Highlight tip at the end of the bar */}
            <div className="absolute top-0 right-0 h-full w-10 bg-[#34D399]/80 blur-[2px]"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="mt-8 flex flex-col items-center drop-shadow-md z-10">
          <div className="text-[#f8fafc] text-xs sm:text-sm tracking-[0.4em] font-light uppercase opacity-90">
            Loading Experience
          </div>
          <div className="text-[#34D399] text-[11px] mt-2 font-mono tracking-widest font-semibold">
            {Math.min(100, Math.round(progress))}%
          </div>
        </div>
      </div>
    </div>
  );
}
