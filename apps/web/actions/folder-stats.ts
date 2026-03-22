"use server";

import { collectFolderStats, type FolderStats } from "@/lib/cost-estimator";

export async function getFolderStats(folderPath: string): Promise<FolderStats | null> {
  try {
    return await collectFolderStats(folderPath);
  } catch {
    return null;
  }
}
