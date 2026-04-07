/**
 * AES-256-GCM encryption for BYOK API keys.
 *
 * Uses Node's built-in `node:crypto` — no external dependencies.
 *
 * Security properties:
 * - AES-256-GCM provides both confidentiality and authenticity (AEAD)
 * - Each key gets a unique random 12-byte IV — same plaintext produces different ciphertext
 * - GCM authentication tag (16 bytes) detects tampering
 * - Master key is 256 bits (32 bytes), read from ENCRYPTION_KEY env var (64 hex chars)
 * - Plaintext is never logged or returned after encryption
 *
 * Storage format:
 * - encrypted: hex string of the ciphertext + 16-byte auth tag (concatenated)
 * - iv: hex string of the 12-byte initialization vector
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHmac,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // 96-bit IV — recommended for GCM
const AUTH_TAG_LENGTH_BYTES = 16; // 128-bit auth tag — GCM default

/**
 * Read and validate the master encryption key from environment.
 * Auto-bootstraps from ~/.codeaudit-ai/.env if ENCRYPTION_KEY is not set.
 * The key must be a 64-character hex string (256 bits).
 */
function getMasterKey(): Buffer {
  let hexKey = process.env["ENCRYPTION_KEY"];

  if (!hexKey) {
    // Auto-bootstrap: read or create key in ~/.codeaudit-ai/.env
    const os = require("node:os") as typeof import("node:os");
    const fs = require("node:fs") as typeof import("node:fs");
    const path = require("node:path") as typeof import("node:path");
    const envDir = path.join(os.homedir(), ".codeaudit-ai");
    const envFile = path.join(envDir, ".env");
    fs.mkdirSync(envDir, { recursive: true });
    let envContents = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : "";
    if (!envContents.includes("ENCRYPTION_KEY=")) {
      const key = randomBytes(32).toString("hex");
      envContents += `ENCRYPTION_KEY=${key}\n`;
      fs.writeFileSync(envFile, envContents, { mode: 0o600 });
    }
    const match = envContents.match(/ENCRYPTION_KEY=([^\n]+)/);
    if (match?.[1]) {
      hexKey = match[1].trim();
      process.env["ENCRYPTION_KEY"] = hexKey;
    }
  }

  if (!hexKey) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set and auto-bootstrap failed.",
    );
  }

  if (hexKey.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY must be a 64-character hex string (256 bits). Got ${hexKey.length} characters.`,
    );
  }

  return Buffer.from(hexKey, "hex");
}

export interface EncryptedKey {
  /** Hex-encoded ciphertext + auth tag (concatenated) */
  encrypted: string;
  /** Hex-encoded 12-byte IV */
  iv: string;
}

/**
 * Encrypt an API key using AES-256-GCM.
 *
 * @param plaintext - The raw API key string to encrypt
 * @returns An object with the hex-encoded ciphertext and IV
 */
export function encryptApiKey(plaintext: string): EncryptedKey {
  const masterKey = getMasterKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, masterKey, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });

  const plaintextBuffer = Buffer.from(plaintext, "utf8");
  const ciphertext = Buffer.concat([
    cipher.update(plaintextBuffer),
    cipher.final(),
  ]);

  // Append the auth tag to the ciphertext for storage
  const authTag = cipher.getAuthTag();
  const encryptedWithTag = Buffer.concat([ciphertext, authTag]);

  return {
    encrypted: encryptedWithTag.toString("hex"),
    iv: iv.toString("hex"),
  };
}

/**
 * Decrypt an API key using AES-256-GCM.
 *
 * @param encrypted - Hex-encoded ciphertext + auth tag (as stored by encryptApiKey)
 * @param iv - Hex-encoded 12-byte IV (as stored by encryptApiKey)
 * @returns The original plaintext API key
 * @throws If the key is tampered with, the auth tag verification will fail
 */
export function decryptApiKey(encrypted: string, iv: string): string {
  const masterKey = getMasterKey();
  const ivBuffer = Buffer.from(iv, "hex");
  const encryptedBuffer = Buffer.from(encrypted, "hex");

  // Split ciphertext and auth tag
  const authTag = encryptedBuffer.subarray(
    encryptedBuffer.length - AUTH_TAG_LENGTH_BYTES,
  );
  const ciphertext = encryptedBuffer.subarray(
    0,
    encryptedBuffer.length - AUTH_TAG_LENGTH_BYTES,
  );

  const decipher = createDecipheriv(ALGORITHM, masterKey, ivBuffer, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(), // throws if auth tag verification fails
  ]);

  return plaintext.toString("utf8");
}

/**
 * Return the masked representation of an API key for display (last 4 characters).
 * Example: "sk-ant-api03-..." -> "...3f7a"
 *
 * @param plaintext - The original API key (only used for masking display — never stored)
 */
export function maskApiKey(plaintext: string): string {
  if (plaintext.length <= 4) {
    return "••••";
  }
  return `••••${plaintext.slice(-4)}`;
}
