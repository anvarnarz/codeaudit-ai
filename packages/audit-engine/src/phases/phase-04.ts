import { runPhaseWithTools } from "../tool-phase-runner";
import type { PhaseRunner } from "../phase-registry";

export const phase04Runner: PhaseRunner = async (ctx, phaseNumber) => {
  await runPhaseWithTools(ctx, phaseNumber);
};
