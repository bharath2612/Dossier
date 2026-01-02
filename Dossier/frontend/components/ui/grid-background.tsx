"use client";

import { cn } from "@/lib/utils";

interface GridBackgroundProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "large" | "accent";
}

export function GridBackground({
  children,
  className,
  variant = "default",
}: GridBackgroundProps) {
  const patternClass = {
    default: "grid-pattern",
    large: "grid-pattern-lg",
    accent: "grid-pattern-accent",
  }[variant];

  return (
    <div className={cn("relative min-h-screen bg-background", patternClass, className)}>
      {children}
    </div>
  );
}
