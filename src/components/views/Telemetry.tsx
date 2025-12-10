import React from "react";

export const Telemetry: React.FC = () => {
  return (
    <div className="p-6 md:p-16 h-screen flex flex-col items-center justify-center text-center fade-in">
      <div className="w-24 h-24 bg-neutral-900/50 rounded-full flex items-center justify-center mb-8 border border-neutral-800 shadow-2xl relative">
        <div className="absolute inset-0 rounded-full border border-white/5 animate-ping opacity-20"></div>
        <i className="fas fa-chart-area text-4xl text-neutral-600"></i>
      </div>
      <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
        Telemetry Hub
      </h1>
      <p className="text-neutral-500 max-w-md mx-auto mb-10 text-lg font-light leading-relaxed">
        Under Dev.
      </p>
      <div className="flex space-x-4">
        <div className="h-2 w-2 bg-neutral-700 rounded-full animate-bounce"></div>
        <div className="h-2 w-2 bg-neutral-700 rounded-full animate-bounce delay-75"></div>
        <div className="h-2 w-2 bg-neutral-700 rounded-full animate-bounce delay-150"></div>
      </div>
    </div>
  );
};
