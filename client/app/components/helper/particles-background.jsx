"use client";

import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { useReducedMotion } from "@/app/hooks/use-reduced-motion";

export default function ParticlesBackground() {
  const prefersReducedMotion = useReducedMotion();

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <div
      className="fixed inset-0 -z-50 h-full w-full pointer-events-none"
      style={{
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, transparent 100px, rgba(0, 0, 0, 0.12) 280px, black 600px)",
        maskImage: "linear-gradient(to bottom, transparent 0px, transparent 100px, rgba(0, 0, 0, 0.12) 280px, black 600px)"
      }}
    >
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="h-full w-full"
        options={{
          background: {
            color: {
              value: "transparent",
            },
          },
          fpsLimit: prefersReducedMotion ? 30 : 60,
          interactivity: {
            events: {
              onHover: {
                enable: !prefersReducedMotion,
                mode: "repulse",
              },
              resize: true,
            },
            modes: {
              repulse: {
                distance: 100,
                duration: 0.4,
              },
            },
          },
          particles: {
            color: {
              value: ["#f8fafc", "#E2E8F0", "#94A3B8", "#ffffff"],
            },
            links: {
              color: "#E2E8F0",
              distance: 150,
              enable: true,
              opacity: 0.12,
              width: 1,
            },
            move: {
              direction: "none",
              enable: !prefersReducedMotion,
              outModes: {
                default: "bounce",
              },
              random: false,
              speed: 0.8,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 55,
            },
            opacity: {
              value: 0.3,
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 3 },
            },
          },
          detectRetina: true,
        }}
      />
    </div>
  );
}
