"use client";

import { useEffect, useState } from "react";
import PillNav from "./effects/PillNav";
import { useAppearance } from "./appearance";

export default function PortfolioNavigation({ items, onNavigate, docked = false }) {
  const { theme } = useAppearance();
  const [active, setActive] = useState("#about");

  useEffect(() => {
    const sections = items.map((item) => document.getElementById(item.href.slice(1))).filter(Boolean);
    if (!sections.length) return;
    const observer = new IntersectionObserver(() => {
      const marker = window.innerHeight * 0.35;
      const current = sections.reduce((found, section) => section.getBoundingClientRect().top <= marker ? section : found, sections[0]);
      setActive(`#${current.id}`);
    }, { rootMargin: "-10% 0px -55% 0px", threshold: [0, 0.5, 1] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return <nav aria-label="Main navigation" />;
  if (docked) {
    const index = Math.max(0, items.findIndex((item) => item.href === active));
    return (
      <nav className="pf-dock-nav" aria-label="Main navigation">
        <span
          className="pf-dock-highlight"
          aria-hidden="true"
          style={{ transform: `translateY(${index * 44}px)` }}
        />
        {items.map((item, i) => (
          <a
            key={item.href}
            href={item.href}
            className="pf-dock-item"
            aria-current={i === index ? "page" : undefined}
            onClick={(event) => {
              onNavigate(event);
              if (event.defaultPrevented) setActive(item.href);
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
    );
  }
  return (
    <PillNav
      items={items}
      activeHref={items.some((item) => item.href === active) ? active : items[0].href}
      onItemClick={(item, _index, event) => {
        onNavigate(event);
        if (event.defaultPrevented) setActive(item.href);
      }}
      theme={theme}
      className="pf-pill-nav"
      ariaLabel="Main navigation"
      size="lg"
      surface="solid"
      itemStyle="plain"
      hoverEffect="glide"
      indicator="pill"
      highlightColor={theme === "dark" ? "#d8e3ff" : "#244c9b"}
      highlightTextColor={theme === "dark" ? "#15213b" : "#ffffff"}
      barColor="var(--pf-panel)"
      textColor="var(--pf-muted)"
      bounce={0.08}
      stretch={0.18}
      glideDuration={0.44}
      intro={false}
    />
  );
}
