import React, { useState } from "react";
import { useLocation } from "react-router";
import { useTheme } from "../../context/ThemeContext";

// Blurs race results while spoiler-free mode is on. "Reveal" uncovers this
// block; "reveal all" uncovers every block on the current page until you
// navigate elsewhere.
export const Spoiler: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { spoilerFree, revealedPage, revealAll } = useTheme();
  const { pathname, search } = useLocation();
  const page = pathname + search;
  const [shown, setShown] = useState(false);
  if (!spoilerFree || shown || revealedPage === page) return <>{children}</>;
  return (
    <div className="relative rounded-md">
      <div aria-hidden className="blur-lg pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs font-medium">
        <span className="text-neutral-300 light:text-neutral-700">
          <i className="fas fa-eye-slash mr-2"></i>Results hidden
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setShown(true)}
            className="px-3 py-1 rounded-md bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
          >
            Reveal
          </button>
          <button
            onClick={() => revealAll(page)}
            className="px-3 py-1 rounded-md text-neutral-400 hover:text-white"
          >
            Reveal all on this page
          </button>
        </div>
      </div>
    </div>
  );
};
