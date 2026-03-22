"use client";
import { ShieldCheck, Shield, Users, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AuditType = "full" | "security" | "team-collaboration" | "code-quality";

const AUDIT_TYPES = [
  { id: "full" as const, icon: ShieldCheck, title: "Full Audit", description: "13 phases: architecture, security, code quality, team practices, and dependencies" },
  { id: "security" as const, icon: Shield, title: "Security-Only", description: "5 phases: vulnerabilities, auth, secrets, and injection risks" },
  { id: "team-collaboration" as const, icon: Users, title: "Team & Collaboration", description: "4 phases: git history, PR patterns, ownership, and contributor health" },
  { id: "code-quality" as const, icon: Code2, title: "Code Quality", description: "4 phases: maintainability, test coverage, documentation, and complexity" },
] as const;

interface AuditTypeCardsProps {
  value: AuditType;
  onChange: (value: AuditType) => void;
}

export function AuditTypeCards({ value, onChange }: AuditTypeCardsProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Audit Type</p>
      <div className="grid grid-cols-2 gap-3">
        {AUDIT_TYPES.map(({ id, icon: Icon, title, description }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors",
              "hover:border-muted-foreground/50 hover:bg-accent/50",
              value === id
                ? "border-primary bg-white text-black ring-2 ring-primary dark:bg-white dark:text-black"
                : "border-zinc-300 dark:border-zinc-700 bg-card shadow-sm"
            )}
          >
            <Icon className={cn("h-5 w-5", value === id ? "text-black dark:text-black" : "text-muted-foreground")} />
            <div>
              <p className={cn("text-sm font-medium leading-none", value === id && "text-black dark:text-black")}>{title}</p>
              <p className={cn("mt-1 text-xs leading-relaxed", value === id ? "text-black/70 dark:text-black/70" : "text-muted-foreground")}>{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
