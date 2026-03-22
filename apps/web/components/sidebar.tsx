"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "grid", label: "Dashboard" },
  { href: "/audit/new", icon: "plus", label: "New Audit" },
  { href: "/history", icon: "clock", label: "History" },
  { href: "/settings/api-keys", icon: "key", label: "API Keys" },
] as const;

function NavIcon({ name, className }: { name: string; className?: string }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
  switch (name) {
    case "grid":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "plus":
      return (
        <svg {...props}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15.5 14" />
        </svg>
      );
    case "key":
      return (
        <svg {...props}>
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
      );
    default:
      return null;
  }
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[252px] h-screen bg-surface border-r border-border flex flex-col py-5 px-3 shrink-0 sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-7">
        <div
          className="w-8 h-8 rounded-[10px] flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, var(--accent), #f59e0b)" }}
        >
          {/* Shield icon 16px */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0a0a0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-bold tracking-[-0.02em] text-text">CodeAudit</div>
          <div className="text-[10px] text-text-muted font-medium tracking-wider -mt-px">AI</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 py-2.5 px-3 rounded-[10px] text-[13px] transition-all duration-150 no-underline",
                active
                  ? "bg-accent-subtle text-accent font-semibold"
                  : "text-text-secondary hover:bg-hover font-normal"
              )}
            >
              <NavIcon
                name={item.icon}
                className={active ? "text-accent" : "text-text-muted"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle at bottom */}
      <div className="pt-3 px-3 border-t border-border mt-2">
        <div className="flex items-center justify-between py-2 px-3">
          <span className="text-xs text-text-muted font-medium">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
