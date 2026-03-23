import { runPhaseWithTools } from "../tool-phase-runner";
import type { PhaseRunner } from "../phase-registry";

export const phase05Runner: PhaseRunner = async (ctx, phaseNumber) => {
  await runPhaseWithTools(ctx, phaseNumber);
};
