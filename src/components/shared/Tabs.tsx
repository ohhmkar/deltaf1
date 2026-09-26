import React from "react";

// Segmented control used for in-page tabs. ←/→ move between tabs.
export function Tabs<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
  label: string;
  size?: "sm" | "md";
}) {
  const move = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = options[(i + d + options.length) % options.length][0];
    onChange(next);
    (e.currentTarget.parentElement?.children[(i + d + options.length) % options.length] as HTMLElement)?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex p-0.5 rounded-lg bg-neutral-900 border border-neutral-800"
    >
      {options.map(([v, text], i) => (
        <button
          key={v}
          role="tab"
          aria-selected={value === v}
          tabIndex={value === v ? 0 : -1}
          onClick={() => onChange(v)}
          onKeyDown={(e) => move(e, i)}
          className={`rounded-md transition-colors ${
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm"
          } ${
            value === v
              ? "bg-neutral-800 text-white font-medium shadow-sm"
              : "text-neutral-500 hover:text-neutral-200"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
