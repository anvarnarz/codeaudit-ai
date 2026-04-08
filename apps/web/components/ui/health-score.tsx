"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface HealthScoreProps {
  score: number;
  size?: "sm" | "lg";
  className?: string;
}

export function HealthScore({ score, size = "lg", className }: HealthScoreProps) {
  const grade =
    score >= 90 ? "A" :
    score >= 75 ? "B" :
    score >= 60 ? "C" :
    score >= 40 ? "D" : "F";

  const color =
    score > 70 ? "var(--success)" :
    score > 40 ? "var(--warning)" :
    "var(--destructive)";

  const sz = size === "lg" ? 110 : 56;
  const strokeW = size === "lg" ? 6 : 4;
  const r = (sz - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className={cn("relative", className)} style={{ width: sz, height: sz }}>
      <svg
        width={sz}
        height={sz}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={sz / 2}
          cy={sz / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeW}
        />
        <circle
          cx={sz / 2}
          cy={sz / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold leading-none"
          style={{
            fontSize: size === "lg" ? 28 : 16,
            color,
          }}
        >
          {score}
        </span>
        {size === "lg" && (
          <span className="text-[13px] text-text-muted mt-0.5">{grade}</span>
        )}
      </div>
    </div>
  );
}
