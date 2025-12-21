import React from "react";

export const SkeletonCard: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return (
    <div className={`minimal-card p-6 animate-pulse ${className}`}>
      <div className="h-4 bg-neutral-800 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-neutral-800 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-neutral-900/30 rounded border border-neutral-800/50"
        >
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-12 h-12 bg-neutral-800 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-800 rounded w-1/3"></div>
              <div className="h-3 bg-neutral-800 rounded w-1/4"></div>
            </div>
          </div>
          <div className="h-6 bg-neutral-800 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-8 h-8 bg-neutral-800 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-neutral-800 rounded w-2/3"></div>
              <div className="h-2 bg-neutral-800 rounded w-1/2"></div>
            </div>
          </div>
          <div className="h-4 bg-neutral-800 rounded w-12"></div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = "",
}) => {
  return (
    <div className={`space-y-2 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-neutral-800 rounded"
          style={{ width: i === lines - 1 ? "70%" : "100%" }}
        ></div>
      ))}
    </div>
  );
};
