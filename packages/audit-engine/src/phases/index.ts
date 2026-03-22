// Phase registry — maps phase number to metadata used by orchestrator.
// Command arrays are defined here; actual implementations in phase-NN.ts files (plan 02).

export type PhaseDefinition = {
  number: number;
  name: string;
  complexity: "simple" | "medium" | "complex";
  // Audit types that include this phase
  includedIn: Array<"full" | "security" | "team-collaboration" | "code-quality">;
};

// Source: RESEARCH.md Pattern 6 (phase-to-type mapping table)
export const PHASE_REGISTRY: PhaseDefinition[] = [
  { number: 0,  name: "Bootstrap",             complexity: "simple",  includedIn: ["full", "security", "team-collaboration", "code-quality"] },
  { number: 1,  name: "Orientation",           complexity: "medium",  includedIn: ["full", "security", "team-collaboration", "code-quality"] },
  { number: 2,  name: "Dependency Health",     complexity: "simple",  includedIn: ["full", "code-quality"] },
  { number: 3,  name: "Test Coverage",         complexity: "medium",  includedIn: ["full", "code-quality"] },
  { number: 4,  name: "Code Complexity",       complexity: "medium",  includedIn: ["full", "code-quality"] },
  { number: 5,  name: "Git Archaeology",       complexity: "medium",  includedIn: ["full", "team-collaboration"] },
  { number: 6,  name: "Security Audit",        complexity: "complex", includedIn: ["full", "security"] },
  { number: 7,  name: "Deep Reads",            complexity: "complex", includedIn: ["full", "security"] },
  { number: 8,  name: "CI/CD",                 complexity: "simple",  includedIn: ["full", "code-quality"] },
  { number: 9,  name: "Documentation",         complexity: "medium",  includedIn: ["full", "code-quality"] },
  { number: 10, name: "Final Report",          complexity: "complex", includedIn: ["full", "security", "team-collaboration", "code-quality"] },
  { number: 11, name: "HTML Reports",          complexity: "complex", includedIn: ["full", "security", "team-collaboration", "code-quality"] },
];

export function getPhasesForAuditType(
  auditType: "full" | "security" | "team-collaboration" | "code-quality",
  depth: "quick" | "deep",
): number[] {
  const phases = PHASE_REGISTRY
    .filter((p) => p.includedIn.includes(auditType))
    .map((p) => p.number);

  // Quick scan skips deep-read phases (6, 7) and HTML report (11)
  if (depth === "quick") {
    return phases.filter((n) => ![6, 7, 11].includes(n));
  }
  return phases;
}

export function getPhaseName(phaseNumber: number): string {
  return PHASE_REGISTRY.find((p) => p.number === phaseNumber)?.name ?? `Phase ${phaseNumber}`;
}

// ============================================================
// Phase runner registrations (plan 02)
// Import side-effect: registers all phase implementations with the orchestrator.
// ============================================================
import { registerPhaseRunner } from "../orchestrator";
import { phase00Runner } from "./phase-00";
import { phase01Runner } from "./phase-01";
import { phase02Runner } from "./phase-02";
import { phase03Runner } from "./phase-03";
import { phase04Runner } from "./phase-04";
import { phase05Runner } from "./phase-05";
import { phase06Runner } from "./phase-06";
import { phase07Runner } from "./phase-07";
import { phase08Runner } from "./phase-08";
import { phase09Runner } from "./phase-09";
import { phase10Runner } from "./phase-10";
import { phase11Runner } from "./phase-11";

registerPhaseRunner(0, phase00Runner);
registerPhaseRunner(1, phase01Runner);
registerPhaseRunner(2, phase02Runner);
registerPhaseRunner(3, phase03Runner);
registerPhaseRunner(4, phase04Runner);
registerPhaseRunner(5, phase05Runner);
registerPhaseRunner(6, phase06Runner);
registerPhaseRunner(7, phase07Runner);
registerPhaseRunner(8, phase08Runner);
registerPhaseRunner(9, phase09Runner);
registerPhaseRunner(10, phase10Runner);
registerPhaseRunner(11, phase11Runner);

export {
  phase00Runner, phase01Runner, phase02Runner, phase03Runner,
  phase04Runner, phase05Runner, phase06Runner, phase07Runner,
  phase08Runner, phase09Runner, phase10Runner, phase11Runner,
};
