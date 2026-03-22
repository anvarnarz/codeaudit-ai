"use client";
import { ShieldCheck, Shield, Users, Code2 } from "lucide-react";
import { SelectCard } from "@/components/ui/select-card";

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
    <div className="space-y-2.5">
      <p className="uppercase text-xs font-semibold tracking-wider text-muted-foreground">
        Audit Type
      </p>
      <div className="grid grid-cols-2 gap-3">
        {AUDIT_TYPES.map(({ id, icon: Icon, title, description }) => {
          const selected = value === id;
          return (
            <SelectCard key={id} selected={selected} onClick={() => onChange(id)}>
              <div className="flex flex-col items-start gap-2.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${
                    selected
                      ? "bg-[hsl(var(--accent-subtle))]"
                      : "bg-[hsl(var(--elevated))]"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] ${
                      selected ? "text-[hsl(var(--accent))]" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-none">{title}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            </SelectCard>
          );
        })}
      </div>
    </div>
  );
}
