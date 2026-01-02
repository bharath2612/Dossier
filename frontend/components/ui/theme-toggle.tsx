"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative flex h-9 w-9 items-center justify-center rounded-md
        border border-border bg-card text-foreground
        transition-colors hover:bg-secondary
        focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background
        ${className}
      `}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <Sun
        className={`h-4 w-4 transition-all ${
          theme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100"
        }`}
        style={{ position: theme === "dark" ? "absolute" : "relative" }}
      />
      <Moon
        className={`h-4 w-4 transition-all ${
          theme === "dark" ? "rotate-0 scale-100" : "-rotate-90 scale-0"
        }`}
        style={{ position: theme === "light" ? "absolute" : "relative" }}
      />
    </button>
  );
}
