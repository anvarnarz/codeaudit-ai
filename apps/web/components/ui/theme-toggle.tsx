"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem("theme") === "light" ? "light" : "dark";
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);

  function toggleTo(t: "dark" | "light") {
    setTheme(t);
    localStorage.setItem("theme", t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  return (
    <div
      className={cn(
        "flex rounded-[10px] overflow-hidden border border-border bg-elevated",
        className
      )}
    >
      <button
        onClick={() => toggleTo("light")}
        className={cn(
          "flex items-center justify-center w-[34px] h-[28px] border-none cursor-pointer transition-all duration-200 p-0",
          theme === "light" ? "bg-text" : "bg-transparent"
        )}
        aria-label="Light theme"
      >
        {/* Sun SVG icon, 14px */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={theme === "light" ? "text-background" : "text-text-muted"}
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>
      <button
        onClick={() => toggleTo("dark")}
        className={cn(
          "flex items-center justify-center w-[34px] h-[28px] border-none cursor-pointer transition-all duration-200 p-0",
          theme === "dark" ? "bg-text" : "bg-transparent"
        )}
        aria-label="Dark theme"
      >
        {/* Moon SVG icon, 14px */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={theme === "dark" ? "text-background" : "text-text-muted"}
        >
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      </button>
    </div>
  );
}
