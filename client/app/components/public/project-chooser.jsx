"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function ProjectChooser({ projects, selected, onSelect }) {
  const root = useRef(null);
  const [placement, setPlacement] = useState({ above: false, maxHeight: 380 });
  useEffect(() => {
    const close = (event) => {
      if (!root.current?.contains(event.target))
        root.current?.removeAttribute("open");
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const close = () => {
    root.current.removeAttribute("open");
    root.current.querySelector("summary").focus({ preventScroll: true });
  };
  return (
    <details
      ref={root}
      className={`pf-project-chooser ${placement.above ? "pf-project-chooser--above" : ""}`}
      onToggle={(event) => {
        if (!event.currentTarget.open) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const aboveSpace = bounds.top - 112;
        const belowSpace = window.innerHeight - bounds.bottom - 24;
        const above = aboveSpace > belowSpace;
        setPlacement({
          above,
          maxHeight: Math.max(
            160,
            Math.min(420, above ? aboveSpace : belowSpace),
          ),
        });
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
        if (!root.current.open) return;
        const buttons = [
          ...root.current.querySelectorAll(".pf-project-option"),
        ];
        const current = buttons.indexOf(document.activeElement);
        let next;
        if (event.key === "ArrowDown") next = (current + 1) % buttons.length;
        if (event.key === "ArrowUp")
          next =
            current < 0
              ? buttons.length - 1
              : (current - 1 + buttons.length) % buttons.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = buttons.length - 1;
        if (next !== undefined) {
          event.preventDefault();
          buttons[next].focus();
        }
      }}
    >
      <summary aria-label={`Choose project: ${selected.name}`}>
        <span>
          <small>Choose project</small>
          <strong>{selected.name}</strong>
        </span>
        <span aria-hidden="true" className="pf-chooser-chevron">
          ⌄
        </span>
      </summary>
      <div
        className="pf-project-options"
        style={{ maxHeight: placement.maxHeight, overflowY: "auto" }}
        role="group"
        aria-label="Choose project"
      >
        <p>
          Selected work <span>{projects.length} projects</span>
        </p>
        {projects.map((project, index) => (
          <button
            type="button"
            key={project.id}
            className="pf-project-option"
            aria-pressed={project.id === selected.id}
            aria-controls="pf-selected-project"
            onClick={() => {
              onSelect(index);
              close();
            }}
          >
            <span className="pf-option-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            {project.images?.[0] && (
              <Image src={project.images[0]} alt="" width={52} height={36} />
            )}
            <span>
              {project.name}
              <small>{project.role}</small>
            </span>
            <span aria-hidden="true">
              {project.id === selected.id ? "✓" : "↗"}
            </span>
          </button>
        ))}
      </div>
    </details>
  );
}
