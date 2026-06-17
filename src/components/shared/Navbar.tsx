import React from "react";
import { useTheme } from "../../context/ThemeContext";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: "dashboard", icon: "fa-chart-pie", label: "Dashboard" },
    { id: "standings", icon: "fa-list", label: "Standings" },
    { id: "season", icon: "fa-calendar", label: "Calendar" },
    { id: "grid", icon: "fa-th", label: "The Grid" },
    { id: "telemetry", icon: "fa-chart-line", label: "Telemetry" },
    { id: "replay", icon: "fa-circle-play", label: "Replay" },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full md:w-16 md:hover:w-64 md:h-screen md:top-0 bg-neutral-950 light:bg-white border-t md:border-t-0 md:border-r border-neutral-800 light:border-neutral-200 z-50 flex md:flex-col justify-between items-center py-2 md:py-8 transition-[width] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group shadow-2xl">
      <div className="hidden md:flex items-center justify-center w-full mb-8 h-8 relative">
        <span className="text-white light:text-neutral-900 text-sm font-bold tracking-tighter absolute transition-all duration-300 group-hover:opacity-0 group-hover:scale-90 pointer-events-none">
          DF1
        </span>
        <span className="text-white light:text-neutral-900 text-xl font-bold tracking-tighter absolute transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 whitespace-nowrap delay-100">
          DeltaF1
        </span>
      </div>

      <div className="flex md:flex-col justify-around w-full md:w-full flex-1 md:justify-center md:space-y-2 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center justify-center md:justify-start w-10 md:w-full h-10 md:h-12 rounded-md transition-all duration-200 md:px-3 overflow-hidden ${
              activeTab === item.id
                ? "text-white light:text-neutral-900 bg-neutral-800 light:bg-neutral-200"
                : "text-neutral-500 light:text-neutral-400 hover:text-neutral-300 light:hover:text-neutral-700 hover:bg-neutral-900/50 light:hover:bg-neutral-100"
            }`}
          >
            <div className="w-6 flex justify-center shrink-0">
              <i className={`fas ${item.icon} text-sm`}></i>
            </div>
            <span className="hidden md:block ml-3 text-sm font-medium whitespace-nowrap opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 delay-100">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Theme Toggle & Version */}
      <div className="hidden md:flex flex-col items-center w-full space-y-4 px-2">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center md:justify-start w-10 md:w-full h-10 md:h-10 rounded-md transition-all duration-200 md:px-3 overflow-hidden text-neutral-500 light:text-neutral-400 hover:text-neutral-300 light:hover:text-neutral-700 hover:bg-neutral-900/50 light:hover:bg-neutral-100"
          title={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          <div className="w-6 flex justify-center shrink-0">
            <i
              className={`fas ${
                theme === "dark" ? "fa-sun" : "fa-moon"
              } text-sm`}
            ></i>
          </div>
          <span className="hidden md:block ml-3 text-sm font-medium whitespace-nowrap opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 delay-100">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        {/* Version */}
        <div className="text-neutral-600 light:text-neutral-400 text-[10px] font-mono group-hover:text-neutral-500">
          <span className="group-hover:hidden transition-opacity duration-300">
            v1.3
          </span>
          <span className="hidden group-hover:inline opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-150">
            {"<3 by ohhmkar"}
          </span>
        </div>
      </div>

      {/* Mobile Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-md transition-all duration-200 text-neutral-500 light:text-neutral-400 hover:text-neutral-300 light:hover:text-neutral-700"
        title={
          theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
        }
      >
        <i
          className={`fas ${theme === "dark" ? "fa-sun" : "fa-moon"} text-sm`}
        ></i>
      </button>
    </div>
  );
};
