"use client";
import { SelectCard } from "@/components/ui/select-card";

export type AuditDepth = "quick" | "deep";

const OPTIONS = [
  { id: "quick" as const, label: "Quick Scan", time: "~30 min", note: "30% sampling, subset of phases" },
  { id: "deep" as const, label: "Deep Audit", time: "1\u20133 hrs", note: "Full analysis, all phases" },
];

interface DepthToggleProps {
  value: AuditDepth;
  onChange: (value: AuditDepth) => void;
}

export function DepthToggle({ value, onChange }: DepthToggleProps) {
  return (
    <div className="space-y-2.5">
      <p className="uppercase text-xs font-semibold tracking-wider text-muted-foreground">
        Audit Depth
      </p>
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map(({ id, label, time, note }) => {
          const selected = value === id;
          return (
            <SelectCard key={id} selected={selected} onClick={() => onChange(id)}>
              <div className="flex flex-col items-start">
                <p className="text-sm font-bold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-1">{time}</p>
                <p className="text-xs text-muted-foreground/70 mt-1.5">{note}</p>
              </div>
            </SelectCard>
          );
        })}
      </div>
    </div>
  );
}
