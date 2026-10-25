"use client";
import { useEffect, useRef } from "react";
import { AppearanceControls } from "./appearance";

export default function PreviewDialog({ title, children, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    element
      .querySelector('[aria-label="Close preview"]')
      ?.focus({ preventScroll: true });
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="pf-dialog"
      aria-labelledby="pf-dialog-title"
      onCancel={onClose}
      onClick={(e) => {
        const bounds = e.currentTarget.getBoundingClientRect();
        if (
          e.target === e.currentTarget &&
          (e.clientX < bounds.left ||
            e.clientX > bounds.right ||
            e.clientY < bounds.top ||
            e.clientY > bounds.bottom)
        )
          onClose();
      }}
    >
      <div className="pf-dialog-bar">
        <span>Preview</span>
        <AppearanceControls />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          autoFocus
        >
          Close ×
        </button>
      </div>
      <h2 id="pf-dialog-title">{title}</h2>
      {children}
    </dialog>
  );
}
