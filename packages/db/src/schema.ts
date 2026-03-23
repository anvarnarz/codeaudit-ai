import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// ============================================================
// Findings JSON schema (used in audits.findings column)
// ============================================================
export type FindingsSeverity = "critical" | "high" | "medium" | "low" | "info";

export type AuditFinding = {
  id: string;
  phase: number; // 0-11 (audit phase number)
  category: string; // e.g. "security", "complexity", "test-coverage"
  severity: FindingsSeverity;
  title: string;
  description: string;
  filePaths?: string[];
  lineNumbers?: number[];
  recommendation?: string;
  metadata?: Record<string, unknown>;
};

export type AuditFindings = {
  summary: {
    score: number; // 0-100
    grade: "A" | "B" | "C" | "D" | "F";
    findings_count: Record<FindingsSeverity, number>;
    categories: string[];
  };
  findings: AuditFinding[];
  phases_completed: number[];
  generated_at: string; // ISO timestamp
};

// ============================================================
// API Keys (BYOK — encrypted at application layer)
// ============================================================
export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  provider: text("provider", { enum: ["anthropic", "openai", "gemini"] }).notNull(),
  label: text("label").notNull().default("Default"),
  // AES-256-GCM encrypted key — stored as hex, never returned to client after submission
  encryptedKey: text("encrypted_key").notNull(),
  // Initialization vector for AES-256-GCM — unique per key
  iv: text("iv").notNull(),
  // Masked version of the key for display (e.g. "••••3f7a") — derived from plaintext at creation
  maskedKey: text("masked_key").notNull().default("••••"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (key) => ({
  providerIdx: index("api_keys_provider_idx").on(key.provider),
}));

// ============================================================
// App Settings (key-value store for configuration)
// ============================================================
export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// ============================================================
// Audits
// ============================================================
export const audits = sqliteTable("audits", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  folderPath: text("folder_path").notNull(),
  folderName: text("folder_name").notNull(),
  auditOutputDir: text("audit_output_dir").notNull(),
  auditType: text("audit_type", {
    enum: ["full", "security", "team-collaboration", "code-quality"],
  }).notNull().default("full"),
  depth: text("depth", {
    enum: ["quick", "deep"],
  }).notNull().default("deep"),
  status: text("status", {
    enum: ["queued", "running", "completed", "failed", "cancelled"],
  }).notNull().default("queued"),
  currentPhase: integer("current_phase"), // 0-11, null when not running
  llmProvider: text("llm_provider", {
    enum: ["anthropic", "openai", "gemini"],
  }).notNull(),
  selectedModel: text("selected_model"),
  apiKeyId: text("api_key_id").references(() => apiKeys.id, { onDelete: "set null" }),
  // Token tracking (stored as integers — microdollar precision)
  tokenCount: integer("token_count").notNull().default(0),
  estimatedCostMicrodollars: integer("estimated_cost").notNull().default(0),
  actualCostMicrodollars: integer("actual_cost").notNull().default(0),
  isGitRepo: integer("is_git_repo", { mode: "boolean" }).notNull().default(true),
  // Structured findings — see AuditFindings type above
  findings: text("findings", { mode: "json" }).$type<AuditFindings>(),
  // v1.2: Structured Phase 0 repo context (polyglot detection)
  // Untyped at DB layer — RepoContext type lives in audit-engine package
  repoContext: text("repo_context", { mode: "json" }),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (a) => ({
  folderPathIdx: index("audits_folder_path_idx").on(a.folderPath),
  statusIdx: index("audits_status_idx").on(a.status),
  createdAtIdx: index("audits_created_at_idx").on(a.createdAt),
}));

// ============================================================
// Audit Phases (per-phase output storage)
// ============================================================
export const auditPhases = sqliteTable("audit_phases", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  auditId: text("audit_id").notNull().references(() => audits.id, { onDelete: "cascade" }),
  phaseNumber: integer("phase_number").notNull(), // 0-11
  status: text("status", {
    enum: ["pending", "running", "completed", "failed", "skipped"],
  }).notNull().default("pending"),
  // Raw LLM output for this phase (markdown)
  output: text("output"),
  // Structured findings extracted from this phase (JSON)
  findings: text("findings", { mode: "json" }).$type<AuditFinding[]>(),
  tokensUsed: integer("tokens_used").notNull().default(0),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});
