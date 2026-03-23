import { z } from "zod";

// OpenAI structured output requires ALL properties in 'required' array.
// No .optional(), no .default() — every field must be plain required.
// Empty values use empty string "", empty array [], or 0.
export const RepoContextSchema = z.object({
  repoName: z.string(),
  remoteUrl: z.string(),
  headCommit: z.string(),
  defaultBranch: z.string(),
  // P0-01: Primary language(s), package manager, frameworks
  primaryLanguages: z.array(z.string()),  // e.g. ["TypeScript", "Python"]
  packageManager: z.string(),              // e.g. "npm", "pip", "cargo", "go mod", "maven", "gradle", "bundler", "composer"
  frameworks: z.array(z.string()),         // e.g. ["Next.js", "Django", "Actix"]
  // P0-02: Test framework and file patterns
  testFramework: z.string(),               // e.g. "jest", "pytest", "go test", "cargo test", "junit"
  testFilePatterns: z.array(z.string()),   // e.g. ["**/*.test.ts", "tests/test_*.py"]
  // P0-03: CI system
  ciSystem: z.string(),                    // e.g. "GitHub Actions", "GitLab CI", "Jenkins", "CircleCI", "none"
  ciConfigPaths: z.array(z.string()),      // e.g. [".github/workflows/ci.yml"]
  // P0-05: Monorepo detection (polyglot)
  isMonorepo: z.boolean(),
  monorepoTool: z.string(),                // e.g. "turborepo", "cargo workspaces", "go modules", "gradle", "maven", "lerna", "nx", "none"
  // P0-04: LOC by language (not just a single number)
  locByLanguage: z.record(z.string(), z.number()), // e.g. { "TypeScript": 5000, "Python": 3000 }
  totalLinesOfCode: z.number(),
  // Preserved from v1
  contributorsLast12Months: z.array(z.object({ name: z.string(), commits: z.number() })),
  summary: z.string(),
});

export type RepoContext = z.infer<typeof RepoContextSchema>;
