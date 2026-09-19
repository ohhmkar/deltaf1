import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";

// Blurs race results while spoiler-free mode is on; click to reveal this one.
export const Spoiler: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { spoilerFree } = useTheme();
  const [shown, setShown] = useState(false);
  if (!spoilerFree || shown) return <>{children}</>;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setShown(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setShown(true);
        }
      }}
      className="relative cursor-pointer rounded-md"
    >
      <div aria-hidden className="blur-lg pointer-events-none select-none">
        {children}
      </div>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-300 light:text-neutral-700">
        <i className="fas fa-eye-slash mr-2"></i>Results hidden · click to reveal
      </span>
    </div>
  );
};
