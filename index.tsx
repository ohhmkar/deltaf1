import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Navbar, ErrorBoundary, ToastProvider } from "./src/components/shared";
import {
  Dashboard,
  Standings,
  Season,
  Grid,
  Replay,
} from "./src/components/views";
import { preloadCareerStats } from "./src/services/statsCache";
import { ThemeProvider } from "./src/context/ThemeContext";

const App: React.FC = () => {
  // Preload career stats in background when app starts
  useEffect(() => {
    preloadCareerStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] light:bg-neutral-50 text-neutral-200 light:text-neutral-800 transition-colors duration-300">
      <Navbar />
      <main className="md:pl-16 h-screen overflow-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/season" element={<Season />} />
          <Route path="/grid" element={<Grid />} />
          <Route path="/replay" element={<Replay />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(
  <ErrorBoundary>
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  </ErrorBoundary>
);
