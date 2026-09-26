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
