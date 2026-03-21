// Schema exports
export * from "./schema.js";

// Client exports
export { createDbClient, getDb, type DbClient } from "./client.js";

// Encryption utilities (AES-256-GCM for BYOK API keys)
export { encryptApiKey, decryptApiKey, maskApiKey, type EncryptedKey } from "./encryption.js";
