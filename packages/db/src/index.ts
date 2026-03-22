// Schema exports (no auth tables — no users/accounts/sessions)
export { apiKeys, appSettings, audits, auditPhases } from "./schema.js";
export type { AuditFinding, AuditFindings, FindingsSeverity } from "./schema.js";

// Client exports
export { getDb, type DbClient } from "./client.js";

// Encryption utilities (AES-256-GCM for BYOK API keys)
export { encryptApiKey, decryptApiKey, maskApiKey, type EncryptedKey } from "./encryption.js";
