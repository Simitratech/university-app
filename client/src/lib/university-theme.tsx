import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type UniversityTheme = "santafe" | "uf" | "neutral";

interface UniversityThemeConfig {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  pageBackgroundGradient: {
    start: string;
    end: string;
  };
  accent: string;
  accentForeground: string;
}

export const UNIVERSITY_THEMES: Record<UniversityTheme, UniversityThemeConfig> = {
  santafe: {
    name: "Santa Fe College",
    primaryColor: "210 80% 45%",
    secondaryColor: "45 90% 55%",
    pageBackgroundGradient: {
      start: "210 80% 25%",
      end: "45 60% 35%",
    },
    accent: "210 80% 50%",
    accentForeground: "0 0% 100%",
  },
  uf: {
    name: "University of Florida",
    primaryColor: "217 91% 50%",
    secondaryColor: "25 95% 53%",
    pageBackgroundGradient: {
      start: "217 91% 30%",
      end: "25 70% 40%",
    },
    accent: "217 91% 55%",
    accentForeground: "0 0% 100%",
  },
  neutral: {
    name: "Default",
    primaryColor: "250 50% 55%",
    secondaryColor: "220 15% 50%",
    pageBackgroundGradient: {
      start: "250 30% 20%",
      end: "220 20% 25%",
    },
    accent: "250 50% 55%",
    accentForeground: "0 0% 100%",
  },
};

interface UniversityThemeContextValue {
  universityTheme: UniversityTheme;
  setUniversityTheme: (theme: UniversityTheme) => void;
  themeConfig: UniversityThemeConfig;
}

const UniversityThemeContext = createContext<UniversityThemeContextValue | null>(null);

export function UniversityThemeProvider({ children }: { children: ReactNode }) {
  const [universityTheme, setUniversityTheme] = useState<UniversityTheme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("universityTheme") as UniversityTheme) || "santafe";
    }
    return "santafe";
  });

  useEffect(() => {
    localStorage.setItem("universityTheme", universityTheme);
    const config = UNIVERSITY_THEMES[universityTheme];
    document.documentElement.style.setProperty("--uni-primary", config.primaryColor);
    document.documentElement.style.setProperty("--uni-secondary", config.secondaryColor);
    document.documentElement.style.setProperty("--uni-gradient-start", config.pageBackgroundGradient.start);
    document.documentElement.style.setProperty("--uni-gradient-end", config.pageBackgroundGradient.end);
    document.documentElement.style.setProperty("--uni-accent", config.accent);
    document.documentElement.style.setProperty("--uni-accent-foreground", config.accentForeground);
  }, [universityTheme]);

  const value = {
    universityTheme,
    setUniversityTheme,
    themeConfig: UNIVERSITY_THEMES[universityTheme],
  };

  return (
    <UniversityThemeContext.Provider value={value}>
      {children}
    </UniversityThemeContext.Provider>
  );
}

export function useUniversityTheme() {
  const context = useContext(UniversityThemeContext);
  if (!context) {
    throw new Error("useUniversityTheme must be used within UniversityThemeProvider");
  }
  return context;
}
