import React from "react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: "dashboard", icon: "fa-chart-pie", label: "Dashboard" },
    { id: "standings", icon: "fa-list", label: "Standings" },
    { id: "season", icon: "fa-calendar", label: "Calendar" },
    { id: "grid", icon: "fa-th", label: "The Grid" },
    { id: "telemetry", icon: "fa-chart-line", label: "Telemetry" },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full md:w-16 md:hover:w-64 md:h-screen md:top-0 bg-neutral-950 border-t md:border-t-0 md:border-r border-neutral-800 z-50 flex md:flex-col justify-between items-center py-2 md:py-8 transition-[width] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group shadow-2xl">
      <div className="hidden md:flex items-center justify-center w-full mb-8 h-8 relative">
        <span className="text-white text-sm font-bold tracking-tighter absolute transition-all duration-300 group-hover:opacity-0 group-hover:scale-90 pointer-events-none">
          DF1
        </span>
        <span className="text-white text-xl font-bold tracking-tighter absolute transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 whitespace-nowrap delay-100">
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
                ? "text-white bg-neutral-800"
                : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50"
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
      <div className="hidden md:flex justify-center w-full text-neutral-600 text-[10px] font-mono group-hover:text-neutral-500">
        <span className="group-hover:hidden transition-opacity duration-300">
          v1.2.1
        </span>
        <span className="hidden group-hover:inline opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-150">
          {"<3 by ohhmkar"}
        </span>
      </div>
    </div>
  );
};
