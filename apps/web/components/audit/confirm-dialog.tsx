"use client";
import { useState } from "react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { AuditType, AuditDepth } from "@/lib/cost-estimator-shared";

const AUDIT_TYPE_LABELS: Record<AuditType, string> = {
  full: "Full Audit",
  security: "Security-Only",
  "team-collaboration": "Team & Collaboration",
  "code-quality": "Code Quality",
};

interface ConfirmAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  folderPaths: string[];
  auditType: AuditType;
  depth: AuditDepth;
  model: string | null;
  estimatedCostRange: [number, number] | null;
}

export function ConfirmAuditDialog({
  open, onOpenChange, onConfirm,
  folderPaths, auditType, depth, model, estimatedCostRange,
}: ConfirmAuditDialogProps) {
  const [confirming, setConfirming] = useState(false);
  const fmtCents = (c: number) => `$${(c / 100).toFixed(2)}`;

  async function handleConfirm() {
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[hsl(var(--surface))] rounded-[18px] border-border backdrop-blur-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold">Start Audit?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-sm text-muted-foreground">
              {/* Summary grid */}
              <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5">
                <span className="text-muted-foreground text-sm">
                  {folderPaths.length > 1 ? "Folders" : "Folder"}
                </span>
                <div className="space-y-0.5">
                  {folderPaths.map((p) => (
                    <p key={p} className="font-mono text-xs text-foreground break-all">{p}</p>
                  ))}
                </div>
                <span className="text-muted-foreground text-sm">Type</span>
                <span className="text-foreground">{AUDIT_TYPE_LABELS[auditType]}</span>
                <span className="text-muted-foreground text-sm">Depth</span>
                <span className="text-foreground">{depth === "quick" ? "Quick Scan (~30 min)" : "Deep Audit (1\u20133 hrs)"}</span>
                <span className="text-muted-foreground text-sm">Model</span>
                <span className="text-foreground">{model ?? "Auto"}</span>
                {estimatedCostRange && (
                  <>
                    <span className="text-muted-foreground text-sm">Est. Cost</span>
                    <span className="text-foreground">{fmtCents(estimatedCostRange[0])}\u2013{fmtCents(estimatedCostRange[1])}</span>
                  </>
                )}
              </div>

              {/* Warning note */}
              <div className="bg-[hsl(var(--elevated))] rounded-[10px] px-3.5 py-2.5 text-sm text-muted-foreground">
                The target folder will be locked read-only during the audit and unlocked when complete.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={confirming}
            className="rounded-[10px] border border-border bg-transparent hover:bg-[hsl(var(--elevated))]"
          >
            Go Back
          </AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className="rounded-[10px] bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {confirming ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Locking folder&hellip;</>
            ) : (
              "Start Audit"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
