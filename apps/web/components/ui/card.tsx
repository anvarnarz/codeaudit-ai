"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Card({ children, hover, onClick, className }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-[--radius-card] p-5 transition-all duration-200",
        hover &&
          "hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_8px_24px_var(--accent-subtle)]",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
