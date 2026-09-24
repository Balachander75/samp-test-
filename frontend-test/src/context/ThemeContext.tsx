import React, { createContext, useEffect } from "react";

interface ThemeContextType {
  isDark: boolean;
  setIsDark: (val: boolean) => void;
  toggleTheme: () => void;
}

const defaultContext: ThemeContextType = {
  isDark: false,
  setIsDark: () => {},
  toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Strictly light mode only
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark");
    try {
      localStorage.removeItem("app_theme");
    } catch {
      // Ignore storage errors
    }
  }, []);

  return (
    <ThemeContext.Provider value={defaultContext}>
      {children}
    </ThemeContext.Provider>
  );
};

