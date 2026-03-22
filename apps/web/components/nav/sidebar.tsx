"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, Plus, History, Settings, Sun, Moon } from "lucide-react";

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

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      )}
      {isDark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 border border-border">
          <span className="text-xs font-bold text-foreground">CA</span>
        </div>
        <span className="text-sm font-semibold text-foreground tracking-wide">
          CodeAudit AI
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-4" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-accent text-foreground font-medium border border-border"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className="border-t border-border px-2 py-3">
        <ThemeToggle />
      </div>
    </aside>
  );
}
