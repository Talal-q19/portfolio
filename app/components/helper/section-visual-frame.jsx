"use client";

function SectionVisualFrame({
  variant = "hero",
  accent = "emerald",
  className = "",
  children,
  ...props
}) {
  return (
    <section
      className={`relative z-10 w-full max-w-[92rem] mx-auto px-4 sm:px-6 lg:px-8 ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export default SectionVisualFrame;
