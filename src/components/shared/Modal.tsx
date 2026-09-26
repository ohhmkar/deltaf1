import React, { useEffect, useRef } from "react";

// Backdrop + panel with Escape / backdrop-click to close, focus moved inside on
// open and handed back to whatever opened it on close.
export const Modal: React.FC<{
  label: string;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}> = ({ label, onClose, className = "", children }) => {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`bg-neutral-900 border border-neutral-700 light:border-neutral-200 rounded-xl w-full p-6 shadow-2xl relative outline-none max-h-[90vh] overflow-y-auto ${className}`}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 z-10"
        >
          <i className="fas fa-times"></i>
        </button>
        {children}
      </div>
    </div>
  );
};
