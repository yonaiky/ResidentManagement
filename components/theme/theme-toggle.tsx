"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THEME_TRANSITION_MS = 250;

function applyThemeTransition() {
  document.documentElement.classList.add("theme-transition");
  window.setTimeout(() => {
    document.documentElement.classList.remove("theme-transition");
  }, THEME_TRANSITION_MS);
}

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggle = useCallback(() => {
    applyThemeTransition();
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("text-muted-foreground", className)}
        aria-label="Tema"
        disabled
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <Sun
        className={cn(
          "h-5 w-5 transition-all",
          isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"
        )}
      />
      <Moon
        className={cn(
          "absolute h-5 w-5 transition-all",
          isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"
        )}
      />
    </Button>
  );
}
