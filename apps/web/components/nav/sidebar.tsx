"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Plus,
  History,
  Settings,
  Sun,
  Moon,
  Shield,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "New Audit",
    href: "/audit/new",
    icon: Plus,
  },
  {
    label: "History",
    href: "/history",
    icon: History,
  },
  {
    label: "Settings",
    href: "/settings/api-keys",
    icon: Settings,
  },
];

function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function setTheme(dark: boolean) {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-xs font-medium text-[hsl(var(--text-secondary))]">
        Theme
      </span>
      <div className="flex rounded-[10px] bg-[hsl(var(--elevated))] p-1">
        <button
          onClick={() => setTheme(false)}
          className={`flex h-7 w-9 items-center justify-center rounded-[8px] transition-all ${
            !isDark
              ? "bg-[hsl(var(--surface))]"
              : ""
          }`}
          title="Light mode"
        >
          <Sun
            className={`h-3.5 w-3.5 ${
              !isDark
                ? "text-[hsl(var(--foreground))]"
                : "text-[hsl(var(--text-secondary))]"
            }`}
            aria-hidden="true"
          />
        </button>
        <button
          onClick={() => setTheme(true)}
          className={`flex h-7 w-9 items-center justify-center rounded-[8px] transition-all ${
            isDark
              ? "bg-[hsl(var(--surface))]"
              : ""
          }`}
          title="Dark mode"
        >
          <Moon
            className={`h-3.5 w-3.5 ${
              isDark
                ? "text-[hsl(var(--foreground))]"
                : "text-[hsl(var(--text-secondary))]"
            }`}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fade-in flex h-full w-[252px] flex-col border-r border-[hsl(var(--border))] bg-background p-5">
      {/* Logo */}
      <div className="mb-7 flex items-center gap-2.5 px-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-yellow-400 to-amber-500">
          <Shield className="h-4 w-4 text-gray-900" aria-hidden="true" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-foreground">
            CodeAudit
          </div>
          <div className="-mt-0.5 text-[10px] font-medium tracking-wider text-muted-foreground">
            AI
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[14px] transition-all ${
                isActive
                  ? "bg-[hsl(var(--accent-subtle))] text-[hsl(var(--accent))] font-semibold"
                  : "text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--hover))] font-medium"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className="h-[18px] w-[18px] flex-shrink-0"
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className="mt-2 border-t border-[hsl(var(--border))] pt-3">
        <ThemeToggle />
      </div>
    </aside>
  );
}
