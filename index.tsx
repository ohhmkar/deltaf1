import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Navbar, ErrorBoundary, ToastProvider } from "./src/components/shared";
import {
  Dashboard,
  Standings,
  Season,
  Grid,
  Telemetry,
} from "./src/components/views";
import { preloadCareerStats } from "./src/services/statsCache";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Preload career stats in background when app starts
  useEffect(() => {
    preloadCareerStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="md:pl-16 h-screen overflow-hidden">
        {activeTab === "dashboard" && <Dashboard onNavigate={setActiveTab} />}
        {activeTab === "telemetry" && <Telemetry />}
        {activeTab === "standings" && <Standings />}
        {activeTab === "season" && <Season />}
        {activeTab === "grid" && <Grid />}
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(
  <ErrorBoundary>
    <ToastProvider>
      <App />
    </ToastProvider>
  </ErrorBoundary>
);
