import { useState, useEffect } from "react";

const THEME_KEY = "pantrypal_theme";

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || "light";
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return { theme, setTheme, toggleTheme, isDark: theme === "dark" };
};

export default useTheme;

