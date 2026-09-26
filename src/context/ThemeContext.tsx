import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  spoilerFree: boolean;
  toggleSpoilerFree: () => void;
  revealedPage: string | null; // page (path+query) where "reveal all" was used
  revealAll: (page: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem("deltaf1-theme") === "light" ? "light" : "dark";
    } catch {
      return "dark"; // storage blocked (e.g. Safari private settings)
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("deltaf1-theme", theme);
    } catch {}

    // Apply theme to document
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  // ponytail: lives here with theme since both are per-viewer display prefs
  const [spoilerFree, setSpoilerFree] = useState(() => {
    try {
      return localStorage.getItem("deltaf1-spoiler-free") === "1";
    } catch {
      return false;
    }
  });
  const toggleSpoilerFree = () =>
    setSpoilerFree((v) => {
      try {
        localStorage.setItem("deltaf1-spoiler-free", v ? "0" : "1");
      } catch {}
      return !v;
    });

  const [revealedPage, revealAll] = useState<string | null>(null);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{
        theme,
        toggleTheme,
        spoilerFree,
        toggleSpoilerFree,
        revealedPage,
        revealAll,
      }}>
      {children}
    </ThemeContext.Provider>
  );
};
