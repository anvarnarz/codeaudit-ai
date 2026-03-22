import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color, className }: BadgeProps) {
  if (color) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-[--radius-badge] text-[11px] font-semibold tracking-[0.02em] border",
          className
        )}
        style={{
          background: `${color}18`,
          color,
          borderColor: `${color}30`,
        }}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-[--radius-badge] text-[11px] font-semibold tracking-[0.02em] border bg-accent-subtle text-accent border-accent/20",
        className
      )}
    >
      {children}
    </span>
  );
}
