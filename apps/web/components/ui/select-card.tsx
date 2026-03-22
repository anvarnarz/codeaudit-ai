"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SelectCardProps {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  className?: string;
}

export function SelectCard({ children, selected, onClick, className }: SelectCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl cursor-pointer transition-all duration-200 border-2",
        selected
          ? "border-accent bg-accent-subtle shadow-[0_0_0_1px_var(--accent),0_4px_12px_rgba(250,204,21,0.12)]"
          : "border-border bg-surface",
        className
      )}
    >
      {children}
    </div>
  );
}
