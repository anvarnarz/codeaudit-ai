import { pgTable, text, timestamp, integer, boolean, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";

// ============================================================
// Users
// ============================================================
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  hasCompletedOnboarding: boolean("has_completed_onboarding").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ============================================================
// Auth.js accounts table
// ============================================================
export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (account) => [
    uniqueIndex("accounts_provider_provider_account_id_idx").on(
      account.provider,
      account.providerAccountId,
    ),
    index("accounts_user_id_idx").on(account.userId),
  ],
);

// ============================================================
// Auth.js sessions table
// ============================================================
export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (session) => [
    index("sessions_user_id_idx").on(session.userId),
  ],
);

// ============================================================
// Auth.js verification tokens table
// ============================================================
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [
    uniqueIndex("verification_tokens_identifier_token_idx").on(
      vt.identifier,
      vt.token,
    ),
  ],
);

// ============================================================
// API Keys (BYOK — encrypted at application layer)
// ============================================================
export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider", {
      enum: ["anthropic", "openai", "gemini"],
    }).notNull(),
    label: text("label").notNull().default("Default"),
    // AES-256-GCM encrypted key — stored as hex, never returned to client after submission
    encryptedKey: text("encrypted_key").notNull(),
    // Initialization vector for AES-256-GCM — unique per key
    iv: text("iv").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (key) => [
    index("api_keys_user_id_idx").on(key.userId),
    index("api_keys_user_id_provider_idx").on(key.userId, key.provider),
  ],
);

// ============================================================
// GitHub Installations (GitHub App, not OAuth App)
// ============================================================
export const githubInstallations = pgTable(
  "github_installations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    installationId: integer("installation_id").notNull(),
    accountLogin: text("account_login").notNull(),
    accountType: text("account_type", {
      enum: ["User", "Organization"],
    })
      .notNull()
      .default("User"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (inst) => [
    index("github_installations_user_id_idx").on(inst.userId),
    uniqueIndex("github_installations_installation_id_idx").on(
      inst.installationId,
    ),
  ],
);

// ============================================================
// Findings JSON schema (used in audits.findings JSONB column)
// This structured schema is defined in Phase 1 so Phase 5 comparison
// can rely on a stable structure.
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
// Audits
// ============================================================
export const audits = pgTable(
  "audits",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    repoId: integer("repo_id").notNull(), // GitHub repo ID
    repoFullName: text("repo_full_name").notNull(), // e.g. "owner/repo"
    auditType: text("audit_type", {
      enum: ["full", "security", "team-collaboration", "code-quality", "custom"],
    })
      .notNull()
      .default("full"),
    depth: text("depth", {
      enum: ["quick", "deep"],
    })
      .notNull()
      .default("deep"),
    status: text("status", {
      enum: ["queued", "running", "completed", "failed", "cancelled"],
    })
      .notNull()
      .default("queued"),
    currentPhase: integer("current_phase"), // 0-11, null when not running
    llmProvider: text("llm_provider", {
      enum: ["anthropic", "openai", "gemini"],
    }).notNull(),
    apiKeyId: text("api_key_id").references(() => apiKeys.id, {
      onDelete: "set null",
    }),
    // Token tracking
    tokenCount: integer("token_count").notNull().default(0),
    estimatedCost: integer("estimated_cost").notNull().default(0), // in microdollars (0.000001 USD)
    actualCost: integer("actual_cost").notNull().default(0), // in microdollars
    // Structured findings — see AuditFindings type above
    findings: jsonb("findings").$type<AuditFindings>(),
    // Optional object storage path for full report bundle (future)
    reportPath: text("report_path"),
    // Worker job ID for tracking
    jobId: text("job_id"),
    startedAt: timestamp("started_at", { mode: "date" }),
    completedAt: timestamp("completed_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (audit) => [
    index("audits_user_id_idx").on(audit.userId),
    index("audits_status_idx").on(audit.status),
    index("audits_user_id_status_idx").on(audit.userId, audit.status),
    index("audits_repo_full_name_idx").on(audit.repoFullName),
  ],
);

// ============================================================
// Audit Phases (per-phase output storage)
// ============================================================
export const auditPhases = pgTable(
  "audit_phases",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    auditId: text("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    phaseNumber: integer("phase_number").notNull(), // 0-11
    status: text("status", {
      enum: ["pending", "running", "completed", "failed", "skipped"],
    })
      .notNull()
      .default("pending"),
    // Raw LLM output for this phase (markdown)
    output: text("output"),
    // Structured findings extracted from this phase
    findings: jsonb("findings").$type<AuditFinding[]>(),
    tokensUsed: integer("tokens_used").notNull().default(0),
    startedAt: timestamp("started_at", { mode: "date" }),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (phase) => [
    index("audit_phases_audit_id_idx").on(phase.auditId),
    uniqueIndex("audit_phases_audit_id_phase_number_idx").on(
      phase.auditId,
      phase.phaseNumber,
    ),
  ],
);
