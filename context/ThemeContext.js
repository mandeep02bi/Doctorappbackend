"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Theme state variables
  const [primaryColor, setPrimaryColor] = useState("indigo"); // indigo, emerald, velvet, rose, amber
  const [typography, setTypography] = useState("sans"); // sans, serif, mono, outfit
  const [buttonStyle, setButtonStyle] = useState("rounded"); // rounded, pill, sharp
  const [appbarStyle, setAppbarStyle] = useState("glass"); // glass, solid, minimal
  const [iconStyle, setIconStyle] = useState("outline"); // outline, filled

  // Apply theme settings as CSS variables / classes to the document element
  useEffect(() => {
    const root = document.documentElement;

    // Define colors mapped to tailwind themes
    const colors = {
      indigo: { primary: "99 102 241", primaryHover: "79 70 229", glow: "rgba(99, 102, 241, 0.15)" },
      emerald: { primary: "16 185 129", primaryHover: "5 150 105", glow: "rgba(16, 185, 129, 0.15)" },
      velvet: { primary: "139 92 246", primaryHover: "124 58 237", glow: "rgba(139, 92, 246, 0.15)" },
      rose: { primary: "244 63 94", primaryHover: "225 29 72", glow: "rgba(244, 63, 94, 0.15)" },
      amber: { primary: "245 158 11", primaryHover: "217 119 6", glow: "rgba(245, 158, 11, 0.15)" },
    };

    const currentColors = colors[primaryColor] || colors.indigo;

    // Set CSS Custom Properties dynamically
    root.style.setProperty("--color-primary-rgb", currentColors.primary);
    root.style.setProperty("--color-primary-hover-rgb", currentColors.primaryHover);
    root.style.setProperty("--color-primary-glow", currentColors.glow);

    // Apply font variables/classes
    root.classList.remove("font-sans", "font-serif", "font-mono", "font-outfit");
    if (typography === "sans") root.classList.add("font-sans");
    else if (typography === "serif") root.classList.add("font-serif");
    else if (typography === "mono") root.classList.add("font-mono");
    else if (typography === "outfit") root.classList.add("font-outfit");

    // Apply button styling variable
    let radius = "8px";
    if (buttonStyle === "pill") radius = "9999px";
    else if (buttonStyle === "sharp") radius = "0px";
    root.style.setProperty("--theme-border-radius", radius);

  }, [primaryColor, typography, buttonStyle]);

  return (
    <ThemeContext.Provider
      value={{
        primaryColor,
        setPrimaryColor,
        typography,
        setTypography,
        buttonStyle,
        setButtonStyle,
        appbarStyle,
        setAppbarStyle,
        iconStyle,
        setIconStyle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
