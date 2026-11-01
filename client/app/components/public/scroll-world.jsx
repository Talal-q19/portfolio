"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useScrollWorld(root, entered, sections) {
  const heroPlayed = useRef(false);
  useLayoutEffect(() => {
    if (!entered || !root.current) return;
    const media = gsap.matchMedia();
    media.add({ motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 900px)" }, ({ conditions }) => {
      if (!conditions.motion) return;
      const q = gsap.utils.selector(root.current);
      const desktop = conditions.desktop;
      const hero = q(".pf-hero")[0];
      if (hero && !heroPlayed.current) {
        const entrance = gsap.timeline({ onComplete: () => { heroPlayed.current = true; } });
        entrance.from(q(".pf-hero-intro > :not(.pf-identity)"), {
          y: 22, opacity: 0, stagger: 0.08,
          duration: 0.95, ease: "power2.out", clearProps: "transform,opacity",
        }, 0);
        entrance.from(q(".pf-hero > .pf-atmosphere"), {
          y: 18, opacity: 0,
          duration: 1.05, ease: "power2.out",
          clearProps: "transform,opacity",
        }, 0.18);
      }
      const arrivals = new Map();
      const entrances = new Map();
      let arrival;
      q(".pf-section-anchor").forEach((anchor) => {
        const section = anchor.querySelector(".pf-section");
        if (!section) return;
        // A small reusable arrival tween keeps repeated navbar clicks cheap.
        arrivals.set(anchor.id, gsap.fromTo(section,
          { y: 12, opacity: 0.82 },
          { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", paused: true,
            immediateRender: false, clearProps: "transform,opacity" },
        ));
        if (anchor.id === "about") return;
        const scenery = anchor.querySelector(".pf-section-scenery");
        if (scenery && desktop) {
          gsap.fromTo(scenery.querySelector(".pf-scenery-lines"),
            { y: 25 },
            { y: -25, ease: "none",
              scrollTrigger: { trigger: anchor, start: "top bottom", end: "bottom top", scrub: true } },
          );
        }
        // Returning upward keeps the finished content in place instead of
        // resetting every card to its large first-entry rotation and offset.
        const returnArrival = gsap.fromTo(section,
          { y: -8 },
          { y: 0, duration: 0.32, ease: "power2.out", paused: true,
            immediateRender: false, clearProps: "transform" },
        );
        const settleReturn = () => returnArrival.progress(1).pause();
        const sequence = gsap.timeline({
          defaults: { duration: 0.65, ease: "power2.out", clearProps: "transform,transformOrigin" },
          scrollTrigger: {
            trigger: anchor, start: "top 87%", end: "bottom 13%",
            toggleActions: "restart complete complete complete",
            fastScrollEnd: true, preventOverlaps: "portfolio-sections",
            onEnterBack: (trigger) => {
              trigger.animation.progress(1).pause();
              arrival?.progress(1).pause();
              if (Math.abs(trigger.getVelocity()) > 1800) return;
              arrival = returnArrival;
              arrival.restart();
            },
            onLeave: settleReturn,
            onLeaveBack: settleReturn,
          },
        });
        entrances.set(anchor.id, sequence);
        const reveal = (selector, from, at) => {
          const targets = anchor.querySelectorAll(selector);
          if (targets.length) sequence.from(targets, from, at);
        };
        reveal(".pf-heading > *", { y: 22, stagger: 0.09 }, 0);
        if (anchor.id === "experience") {
          // Career details unfold from opposite sides.
          reveal(".pf-experience-grid > aside", { x: desktop ? -75 : -25, rotationY: desktop ? -15 : -5 }, 0.15);
          reveal(".pf-experience-details", { x: desktop ? 75 : 25, rotationY: desktop ? 18 : 6 }, 0.3);
        } else if (anchor.id === "skills") {
          // Controls lift first; the skill stack rolls up behind them.
          reveal(".pf-skills-bar", { y: 35 }, 0.15);
          reveal(".pf-skills-content", { y: 65, rotationX: desktop ? -35 : -12, transformOrigin: "50% 100%" }, 0.3);
        } else if (anchor.id === "projects") {
          // Carousel and selected work assemble with different depths.
          reveal(".pf-project-selection", { scale: 0.8, rotationZ: desktop ? -6 : -2, y: 45 }, 0.15);
          reveal(".pf-project-details", { rotationY: desktop ? 35 : 10, z: -140, x: desktop ? 80 : 20, transformOrigin: "0% 50%" }, 0.3);
        } else if (anchor.id === "education") {
          // Credentials turn up one after another like a row of cards.
          reveal(".pf-education-grid > article", { y: 75, rotationX: desktop ? -35 : -12, rotationZ: -3, stagger: 0.2, transformOrigin: "50% 100%" }, 0.15);
        } else if (anchor.id === "contact") {
          // Copy settles forward while the form opens from its top edge.
          reveal(".pf-contact-copy", { z: -120, scale: 0.92, y: 30 }, 0.15);
          reveal(".pf-contact-grid > :last-child", { rotationX: desktop ? 28 : 8, y: 55, transformOrigin: "50% 0%" }, 0.3);
        }
      });
      const navigate = (event) => {
        const next = arrivals.get(event.detail?.key);
        if (!next) return;
        ScrollTrigger.update();
        entrances.get(event.detail.key)?.progress(1).pause();
        arrival?.progress(1).pause();
        arrival = next;
        arrival.restart();
      };
      window.addEventListener("portfolio:navigate", navigate);
      let alive = true;
      let refreshTimer;
      const refresh = () => {
        if (!alive) return;
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => { if (alive) ScrollTrigger.refresh(); }, 120);
      };
      document.fonts?.ready.then(refresh);
      const element = root.current;
      element.addEventListener("load", refresh, true);
      return () => {
        alive = false;
        clearTimeout(refreshTimer);
        element.removeEventListener("load", refresh, true);
        window.removeEventListener("portfolio:navigate", navigate);
      };
    }, root);
    return () => media.revert();
  }, [root, entered, sections]);
}
