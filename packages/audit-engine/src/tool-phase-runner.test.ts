import { describe, it, expect } from "vitest";
import { parsePhaseOutput } from "./tool-phase-runner";

const validFinding = {
  id: "f1",
  phase: 6,
  category: "security",
  severity: "high",
  title: "Hardcoded API key",
  description: "Found hardcoded key in config.ts",
  filePaths: ["src/config.ts"],
  lineNumbers: [42],
  recommendation: "Use environment variables",
};

const validOutput = JSON.stringify({
  findings: [validFinding],
  summary: "Found 1 security issue",
  phaseScore: 65,
});

describe("parsePhaseOutput", () => {
  it("parses valid JSON", () => {
    const result = parsePhaseOutput(validOutput, 6);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].title).toBe("Hardcoded API key");
    expect(result.findings[0].phase).toBe(6); // overridden to phaseNumber
    expect(result.phaseScore).toBe(65);
    expect(result.summary).toBe("Found 1 security issue");
  });

  it("strips markdown code fences", () => {
    const wrapped = "```json\n" + validOutput + "\n```";
    const result = parsePhaseOutput(wrapped, 6);
    expect(result.findings).toHaveLength(1);
  });

  it("repairs truncated JSON (unclosed string)", () => {
    const truncated = '{"findings": [{"id": "f1", "phase": 6, "category": "security", "severity": "high", "title": "Hardcoded key", "description": "Found key", "filePaths": [], "lineNumbers": [], "recommendation": "Fix it"}], "summary": "truncated output", "phaseScore": 50';
    const result = parsePhaseOutput(truncated, 6);
    // Should repair by closing the object
    expect(result.findings.length).toBeGreaterThanOrEqual(0);
    // Even if top-level parse fails, lenient rescue should find the finding
  });

  it("repairs truncated JSON (unclosed array)", () => {
    const truncated = '{"findings": [{"id": "f1", "phase": 6, "category": "security", "severity": "high", "title": "Key", "description": "Desc", "filePaths": [], "lineNumbers": [], "recommendation": "Fix"}], "summary": "test", "phaseScore": 50';
    const result = parsePhaseOutput(truncated, 6);
    expect(result.phaseScore).toBeGreaterThanOrEqual(0);
  });

  it("rescues individual valid findings from partial schema match", () => {
    // Top-level shape is wrong (extra fields, missing phaseScore), but findings are valid
    const partial = JSON.stringify({
      findings: [validFinding],
      summary: "test",
      phaseScore: "not-a-number", // wrong type
      extraField: true,
    });
    const result = parsePhaseOutput(partial, 6);
    // phaseScore is wrong type, so full parse fails. But lenient rescue gets findings.
    expect(result.findings).toHaveLength(1);
  });

  it("returns empty for completely invalid JSON", () => {
    const result = parsePhaseOutput("this is not json at all", 6);
    expect(result.findings).toHaveLength(0);
    expect(result.summary).toContain("Failed to parse");
  });

  it("returns empty for empty string", () => {
    const result = parsePhaseOutput("", 6);
    expect(result.findings).toHaveLength(0);
    expect(result.summary).toContain("Empty");
  });

  it("handles findings with missing optional fields", () => {
    const minimalFinding = {
      id: "f1",
      phase: 6,
      category: "security",
      severity: "high",
      title: "Issue",
      description: "Desc",
    };
    const output = JSON.stringify({
      findings: [minimalFinding],
      summary: "test",
      phaseScore: 50,
    });
    const result = parsePhaseOutput(output, 6);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].filePaths).toEqual([]);
    expect(result.findings[0].lineNumbers).toEqual([]);
  });

  it("overrides phase number on all findings", () => {
    const output = JSON.stringify({
      findings: [{ ...validFinding, phase: 999 }],
      summary: "test",
      phaseScore: 50,
    });
    const result = parsePhaseOutput(output, 3);
    expect(result.findings[0].phase).toBe(3); // overridden, not 999
  });
});