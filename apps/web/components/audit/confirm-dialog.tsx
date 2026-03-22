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
  onConfirm: () => Promise<void>;   // async — locks folder + creates output dir
  folderPaths: string[];            // per D-04: array of paths
  auditType: AuditType;
  depth: AuditDepth;
  model: string | null;            // null = Auto
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Start Audit?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                <span className="text-foreground font-medium">
                  {folderPaths.length > 1 ? "Folders" : "Folder"}
                </span>
                <div className="space-y-0.5">
                  {folderPaths.map((p) => (
                    <p key={p} className="font-mono text-xs break-all">{p}</p>
                  ))}
                </div>
                <span className="text-foreground font-medium">Type</span>
                <span>{AUDIT_TYPE_LABELS[auditType]}</span>
                <span className="text-foreground font-medium">Depth</span>
                <span>{depth === "quick" ? "Quick Scan (~30 min)" : "Deep Audit (1–3 hrs)"}</span>
                <span className="text-foreground font-medium">Model</span>
                <span>{model ?? "Auto"}</span>
                {estimatedCostRange && (
                  <>
                    <span className="text-foreground font-medium">Est. Cost</span>
                    <span>{fmtCents(estimatedCostRange[0])}–{fmtCents(estimatedCostRange[1])}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground/70 pt-2 border-t border-zinc-300 dark:border-zinc-700">
                The target folder will be locked read-only during the audit and unlocked when complete.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={confirming}>Go Back</AlertDialogCancel>
          <Button onClick={handleConfirm} disabled={confirming}>
            {confirming ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Locking folder…</>
            ) : (
              "Start Audit"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
