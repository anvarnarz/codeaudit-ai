"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, XCircle, Plus, Trash2 } from "lucide-react";
import { validateFolder, type FolderValidationResult } from "@/actions/folders";

const RECENT_FOLDERS = ["my-saas-app", "api-gateway", "frontend-v2"];

interface FolderPickerProps {
  value: string[];
  onChange: (paths: string[], validations: (FolderValidationResult | null)[]) => void;
}

export function FolderPicker({ value, onChange }: FolderPickerProps) {
  const [validations, setValidations] = useState<(FolderValidationResult | null)[]>(
    () => value.map(() => null)
  );
  const [pending, startTransition] = useTransition();

  function updateEntry(index: number, newPath: string) {
    const newPaths = [...value];
    newPaths[index] = newPath;
    const newValidations = [...validations];
    newValidations[index] = null;
    setValidations(newValidations);
    onChange(newPaths, newValidations);

    if (newPath.length > 3) {
      startTransition(async () => {
        const result = await validateFolder(newPath);
        setValidations((prev) => {
          const updated = [...prev];
          updated[index] = result;
          return updated;
        });
        onChange(newPaths, newValidations.map((v, i) => (i === index ? result : v)));
      });
    }
  }

  function addEntry() {
    const newPaths = [...value, ""];
    const newValidations = [...validations, null];
    setValidations(newValidations);
    onChange(newPaths, newValidations);
  }

  function removeEntry(index: number) {
    if (value.length <= 1) return;
    const newPaths = value.filter((_, i) => i !== index);
    const newValidations = validations.filter((_, i) => i !== index);
    setValidations(newValidations);
    onChange(newPaths, newValidations);
  }

  return (
    <div className="space-y-3">
      <p className="uppercase text-xs font-semibold tracking-wider text-muted-foreground">
        Target Folder{value.length > 1 ? "s" : ""}
      </p>

      {value.map((folderPath, index) => {
        const v = validations[index];
        return (
          <div key={index} className="space-y-1.5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="/Users/you/Projects/my-repo"
                  value={folderPath}
                  onChange={(e) => updateEntry(index, e.target.value)}
                  className={`font-mono bg-[hsl(var(--elevated))] focus:border-[hsl(var(--accent))] focus:ring-[hsl(var(--accent))] ${
                    v?.valid === false
                      ? "border-destructive"
                      : v?.valid === true
                      ? "border-green-600"
                      : ""
                  }`}
                />
                {pending && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    checking...
                  </span>
                )}
              </div>
              {value.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEntry(index)}
                  title="Remove folder"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {v?.valid === true && (
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {v.folderName}
                </p>
                {!v.isGitRepo && (
                  <Alert variant="default" className="border-yellow-600/50 bg-yellow-600/10">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-600 text-xs">
                      Not a git repository -- git-specific audit phases will be skipped. Continue anyway?
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {v?.valid === false && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <XCircle className="h-3.5 w-3.5" />
                {v.error}
              </p>
            )}
          </div>
        );
      })}

      {/* Recent folder suggestions */}
      <div className="flex flex-wrap gap-1.5">
        {RECENT_FOLDERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => updateEntry(0, `/Users/you/Projects/${f}`)}
            className="px-2.5 py-1 rounded-lg bg-[hsl(var(--elevated))] text-[hsl(var(--text-secondary))] text-xs font-mono hover:bg-[hsl(var(--hover))] transition-colors cursor-pointer border border-transparent hover:border-border"
          >
            {f}
          </button>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addEntry}
        className="w-full gap-1.5 text-muted-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Folder
      </Button>
    </div>
  );
}
