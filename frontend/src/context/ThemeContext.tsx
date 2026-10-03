import React, { createContext, useContext, useLayoutEffect, useRef, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem("erp_theme");
      if (stored === "dark" || stored === "light") return stored;
      return "light";
    } catch {
      return "light";
    }
  });
  const currentTheme = useRef(theme);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
    localStorage.setItem("erp_theme", theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    if (newTheme === currentTheme.current) return;

    const root = document.documentElement;
    currentTheme.current = newTheme;
    root.classList.toggle("dark", newTheme === "dark");
    root.classList.toggle("light", newTheme === "light");
    root.style.colorScheme = newTheme;
    localStorage.setItem("erp_theme", newTheme);
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setTheme(currentTheme.current === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
