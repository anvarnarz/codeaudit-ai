// Schema exports (no auth tables — no users/accounts/sessions)
export { apiKeys, appSettings, audits, auditPhases } from "./schema";
export type { AuditFinding, AuditFindings, FindingsSeverity } from "./schema";

// Client exports
export { getDb, type DbClient } from "./client";

// Encryption utilities (AES-256-GCM for BYOK API keys)
export { encryptApiKey, decryptApiKey, maskApiKey, type EncryptedKey } from "./encryption";
