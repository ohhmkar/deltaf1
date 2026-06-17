import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Navbar, ErrorBoundary, ToastProvider } from "./src/components/shared";
import {
  Dashboard,
  Standings,
  Season,
  Grid,
  Telemetry,
  Replay,
} from "./src/components/views";
import { preloadCareerStats } from "./src/services/statsCache";
import { ThemeProvider } from "./src/context/ThemeContext";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Preload career stats in background when app starts
  useEffect(() => {
    preloadCareerStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] light:bg-neutral-50 text-neutral-200 light:text-neutral-800 transition-colors duration-300">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="md:pl-16 h-screen overflow-hidden">
        {activeTab === "dashboard" && <Dashboard onNavigate={setActiveTab} />}
        {activeTab === "telemetry" && <Telemetry />}
        {activeTab === "standings" && <Standings />}
        {activeTab === "season" && <Season />}
        {activeTab === "grid" && <Grid />}
        {activeTab === "replay" && <Replay />}
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(
  <ErrorBoundary>
    <ThemeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </ErrorBoundary>
);
