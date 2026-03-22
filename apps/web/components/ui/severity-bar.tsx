"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SeverityData {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

interface SeverityBarProps {
  data: SeverityData;
  className?: string;
}

const SEVERITY_CONFIG = [
  { key: "critical" as const, color: "var(--severity-critical)", label: "CRIT" },
  { key: "high" as const, color: "var(--severity-high)", label: "HIGH" },
  { key: "medium" as const, color: "var(--severity-medium)", label: "MED" },
  { key: "low" as const, color: "var(--severity-low)", label: "LOW" },
  { key: "info" as const, color: "var(--severity-info)", label: "INFO" },
];

export function SeverityBar({ data, className }: SeverityBarProps) {
  const maxVal = Math.max(...Object.values(data), 1);

  return (
    <div
      className={cn("flex gap-3 items-end", className)}
      style={{ height: 100 }}
    >
      {SEVERITY_CONFIG.map(({ key, color, label }) => {
        const val = data[key] || 0;
        const h = Math.max((val / maxVal) * 80, 4);
        return (
          <div
            key={key}
            className="flex flex-col items-center gap-1.5 flex-1"
          >
            <span
              className="text-[12px] font-semibold"
              style={{ color }}
            >
              {val}
            </span>
            <div
              className="w-full max-w-[36px] rounded-md"
              style={{
                height: h,
                background: color,
                opacity: 0.85,
                transition: "height 0.6s ease",
              }}
            />
            <span
              className="text-[10px] uppercase tracking-[0.05em] text-text-muted"
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
