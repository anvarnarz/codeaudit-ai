"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutGrid, Plus, Clock, Key, Shield, Sun, Moon } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/audit/new", icon: Plus, label: "New Audit" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/settings/api-keys", icon: Key, label: "API Keys" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    setTheme(stored === "light" ? "light" : "dark");
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <aside
      className="fade-in"
      style={{
        width: 252,
        height: "100vh",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 12px",
        flexShrink: 0,
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 12px", marginBottom: 28 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--accent), #f59e0b)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Shield size={16} color="#0a0a0b" strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
            CodeAudit
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.04em", marginTop: -1 }}>
            AI
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                textDecoration: "none",
                background: active ? "var(--accent-subtle)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={18} color={active ? "var(--accent)" : "var(--text-muted)"} strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div style={{ padding: "12px 12px 4px", borderTop: "1px solid var(--border)", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Theme</span>
          <div
            style={{
              display: "flex",
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid var(--border)",
              background: "var(--elevated)",
            }}
          >
            <button
              onClick={() => theme !== "light" && toggleTheme()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 28,
                border: "none",
                cursor: "pointer",
                background: theme === "light" ? "var(--text)" : "transparent",
                transition: "all 0.2s ease",
                padding: 0,
              }}
            >
              <Sun size={14} color={theme === "light" ? "var(--background)" : "var(--text-muted)"} />
            </button>
            <button
              onClick={() => theme !== "dark" && toggleTheme()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 28,
                border: "none",
                cursor: "pointer",
                background: theme === "dark" ? "var(--text)" : "transparent",
                transition: "all 0.2s ease",
                padding: 0,
              }}
            >
              <Moon size={14} color={theme === "dark" ? "var(--background)" : "var(--text-muted)"} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
