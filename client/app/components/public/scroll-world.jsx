"use client";

import { useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useScrollWorld(root, entered, sections) {
  useLayoutEffect(() => {
    if (!entered || !root.current) return;
    const media = gsap.matchMedia();
    media.add({ motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 900px)" }, ({ conditions }) => {
      if (!conditions.motion) return;
      const q = gsap.utils.selector(root.current);
      const desktop = conditions.desktop;
      const hero = q(".pf-hero")[0];
      if (hero) {
        gsap.from(q(".pf-hero-intro > :not(.pf-identity)"), {
          y: 70, rotationX: -35, z: -180, opacity: 0, stagger: 0.09,
          duration: 1.1, ease: "power3.out", clearProps: "all",
        });
        gsap.from(q(".pf-hero > .pf-atmosphere"), {
          y: 55, rotationY: -14, z: -120, opacity: 0,
          duration: 1.1, delay: 0.2, ease: "power3.out",
          clearProps: "transform,opacity",
        });
        gsap.to(q(".pf-hero-intro"), {
          z: desktop ? -450 : -180, rotationY: desktop ? -18 : -5, y: -80, opacity: 0.15, ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.7 },
        });
      }
      const poses = {
        experience: { rotationY: -32, xPercent: -12, z: -300 },
        skills: { rotationX: 38, y: 150, z: -380 },
        projects: { rotationY: 32, xPercent: 12, z: -350 },
        education: { rotationX: -28, rotationZ: -5, y: 120, z: -250 },
        contact: { scale: 0.72, rotationX: 18, y: 100, z: -400 },
      };
      q(".pf-section-anchor").forEach((anchor) => {
        if (anchor.id === "about") return;
        const section = anchor.querySelector(".pf-section");
        if (!section) return;
        const scenery = anchor.querySelector(".pf-section-scenery");
        if (scenery) {
          gsap.fromTo(scenery.querySelector(".pf-scenery-lines"),
            { y: desktop ? 90 : 35, rotation: -5, scale: 1.08 },
            { y: desktop ? -90 : -35, rotation: 5, scale: 1, ease: "none",
              scrollTrigger: { trigger: anchor, start: "top bottom", end: "bottom top", scrub: 1.3 } },
          );
          gsap.fromTo(scenery.querySelectorAll(".pf-scenery-plane"),
            { rotationY: -28, rotationX: 30, y: 50 },
            { rotationY: 28, rotationX: 55, y: -70, stagger: 0.12, ease: "none",
              scrollTrigger: { trigger: anchor, start: "top bottom", end: "bottom top", scrub: 1 } },
          );
          gsap.fromTo(scenery.querySelectorAll(".pf-scenery-glow"),
            { xPercent: -12, yPercent: 10 },
            { xPercent: 12, yPercent: -10, ease: "none",
              scrollTrigger: { trigger: anchor, start: "top bottom", end: "bottom top", scrub: 1.8 } },
          );
        }
        gsap.fromTo(section,
          { ...(desktop ? poses[anchor.id] : { rotationX: 12, y: 60, z: -100 }), opacity: 0.2, transformOrigin: "50% 30%" },
          {
            rotationX: 0, rotationY: 0, rotationZ: 0, xPercent: 0, y: 0, z: 0, scale: 1, opacity: 1, ease: "none",
            scrollTrigger: { trigger: anchor, start: "top 95%", end: "top 22%", scrub: 0.8, invalidateOnRefresh: true },
          },
        );
        const cards = anchor.querySelectorAll(".pf-education-grid > article, .pf-project-card, .pf-experience-grid > article, .pf-contact-grid > :last-child");
        if (cards.length) gsap.from(cards, {
          rotationY: desktop ? -24 : -8, rotationX: 12, z: -180, y: 55,
          stagger: 0.15, ease: "none",
          scrollTrigger: { trigger: anchor, start: "top 80%", end: "top 15%", scrub: 0.6 },
        });
      });
      let alive = true;
      document.fonts?.ready.then(() => { if (alive) ScrollTrigger.refresh(); });
      const element = root.current;
      const refresh = () => ScrollTrigger.refresh();
      element.addEventListener("load", refresh, true);
      return () => { alive = false; element.removeEventListener("load", refresh, true); };
    }, root);
    return () => media.revert();
  }, [root, entered, sections]);
}
