"use client";

import { useState } from "react";
import { FolderPicker } from "@/components/audit/folder-picker";
import { AuditTypeCards, type AuditType } from "@/components/audit/audit-type-cards";
import { DepthToggle, type AuditDepth } from "@/components/audit/depth-toggle";
import { ModelSelector } from "@/components/audit/model-selector";
import { CostEstimate } from "@/components/audit/cost-estimate";
import { ConfirmAuditDialog } from "@/components/audit/confirm-dialog";
import { Button } from "@/components/ui/button";
import { startAudit } from "@/actions/audit-start";
import { getFolderStats } from "@/actions/folder-stats";
import type { FolderValidationResult } from "@/actions/folders";
import type { ApiKeyRecord } from "@/actions/api-keys";
import type { FolderStats, Provider } from "@/lib/cost-estimator";
import { estimateCostRange } from "@/lib/cost-estimator";

interface NewAuditFormProps {
  initialKeys: ApiKeyRecord[];
}

export function NewAuditForm({ initialKeys }: NewAuditFormProps) {
  const [folderPaths, setFolderPaths] = useState<string[]>([""]);
  const [folderValidations, setFolderValidations] = useState<(FolderValidationResult | null)[]>([null]);
  const [folderStats, setFolderStats] = useState<FolderStats | null>(null);

  const [auditType, setAuditType] = useState<AuditType>("full");
  const [depth, setDepth] = useState<AuditDepth>("deep");
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(
    initialKeys[0]?.id ?? null
  );
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Derive the selected key object for provider info
  const selectedKey = initialKeys.find((k) => k.id === selectedKeyId) ?? null;
  const provider: Provider | null = selectedKey?.provider ?? null;

  // Handle folder picker changes — load folder stats for first valid folder
  async function handleFolderChange(
    paths: string[],
    validations: (FolderValidationResult | null)[]
  ) {
    setFolderPaths(paths);
    setFolderValidations(validations);

    // Find the first valid folder and collect stats
    const firstValidIdx = validations.findIndex((v) => v?.valid === true);
    if (firstValidIdx >= 0) {
      const validResult = validations[firstValidIdx];
      if (validResult?.valid) {
        const stats = await getFolderStats(validResult.folderPath);
        setFolderStats(stats);
      }
    } else {
      setFolderStats(null);
    }
  }

  // Determine if form can be submitted
  const hasValidFolder = folderValidations.some((v) => v?.valid === true);
  const canSubmit = hasValidFolder && selectedKeyId !== null;

  // Build the cost range for the confirm dialog
  const costRange =
    provider
      ? estimateCostRange(folderStats, auditType, depth, provider)
      : null;

  async function handleConfirm() {
    const validFolders = folderValidations
      .map((v, i) => (v?.valid ? { path: folderPaths[i], name: (v as Extract<FolderValidationResult, { valid: true }>).folderName } : null))
      .filter((f): f is { path: string; name: string } => f !== null);

    await startAudit({
      folderPaths: validFolders.map((f) => f.path),
      folderNames: validFolders.map((f) => f.name),
      auditType,
      depth,
      apiKeyId: selectedKeyId!,
      selectedModel,
      llmProvider: selectedKey!.provider,
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">New Audit</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select one or more folders and configure your audit.
        </p>
      </div>

      <FolderPicker
        value={folderPaths}
        onChange={handleFolderChange}
      />

      <AuditTypeCards value={auditType} onChange={setAuditType} />

      <DepthToggle value={depth} onChange={setDepth} />

      <ModelSelector
        keys={initialKeys.map((k) => ({
          id: k.id,
          provider: k.provider,
          label: k.label,
          maskedKey: k.maskedKey,
        }))}
        selectedKeyId={selectedKeyId}
        selectedModel={selectedModel}
        onKeyChange={setSelectedKeyId}
        onModelChange={setSelectedModel}
      />

      <CostEstimate
        stats={folderStats}
        auditType={auditType}
        depth={depth}
        provider={provider}
      />

      <div className="flex justify-end pb-8">
        <Button
          onClick={() => setDialogOpen(true)}
          disabled={!canSubmit}
          size="lg"
        >
          Start Audit
        </Button>
      </div>

      <ConfirmAuditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirm}
        folderPaths={
          folderValidations
            .map((v, i) => (v?.valid ? folderPaths[i] : null))
            .filter((p): p is string => p !== null)
        }
        auditType={auditType}
        depth={depth}
        model={selectedModel}
        estimatedCostRange={costRange}
      />
    </div>
  );
}
