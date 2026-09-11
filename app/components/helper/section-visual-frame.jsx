"use client";

import { forwardRef } from "react";

const SectionVisualFrame = forwardRef(function SectionVisualFrame({
  variant = "hero",
  accent = "emerald",
  className = "",
  children,
  ...props
}, ref) {
  return (
    <section ref={ref} className={`relative z-10 mx-auto w-full max-w-[92rem] px-4 sm:px-6 lg:px-8 ${className}`} {...props}>
      {children}
    </section>
  );
});

export default SectionVisualFrame;