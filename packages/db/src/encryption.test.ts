/**
 * Unit tests for AES-256-GCM encryption utility.
 *
 * Tests run against a test encryption key to avoid requiring the real ENCRYPTION_KEY.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { encryptApiKey, decryptApiKey, maskApiKey } from "./encryption.js";

// A deterministic 256-bit test key (64 hex chars)
const TEST_KEY = "a".repeat(64); // 0xaaaa...64 chars — 256 bits of test key material

beforeAll(() => {
  process.env["ENCRYPTION_KEY"] = TEST_KEY;
});

afterAll(() => {
  delete process.env["ENCRYPTION_KEY"];
});

describe("encryptApiKey / decryptApiKey", () => {
  it("round-trip: encrypt then decrypt returns the original key", () => {
    const original = "sk-ant-api03-test-key-value";
    const { encrypted, iv } = encryptApiKey(original);
    const decrypted = decryptApiKey(encrypted, iv);
    expect(decrypted).toBe(original);
  });

  it("produces different ciphertexts for same plaintext (unique IVs)", () => {
    const plaintext = "sk-ant-api03-same-key";
    const result1 = encryptApiKey(plaintext);
    const result2 = encryptApiKey(plaintext);

    // IVs must be different
    expect(result1.iv).not.toBe(result2.iv);
    // Ciphertexts must be different
    expect(result1.encrypted).not.toBe(result2.encrypted);
  });

  it("encrypted value is not readable as the original key (ciphertext is not plaintext)", () => {
    const original = "my-super-secret-api-key";
    const { encrypted } = encryptApiKey(original);

    // The ciphertext hex string should not contain the plaintext
    expect(encrypted).not.toContain(original);

    // Decode hex to binary and check it doesn't contain plaintext as UTF-8
    const decoded = Buffer.from(encrypted, "hex").toString("utf8");
    expect(decoded).not.toContain(original);
  });

  it("decryption with a different master key fails with an error", () => {
    const original = "sk-openai-test-key";
    const { encrypted, iv } = encryptApiKey(original);

    // Temporarily swap to a different master key
    const originalKey = process.env["ENCRYPTION_KEY"];
    process.env["ENCRYPTION_KEY"] = "b".repeat(64);

    expect(() => {
      decryptApiKey(encrypted, iv);
    }).toThrow(); // GCM auth tag verification fails

    // Restore the test key
    process.env["ENCRYPTION_KEY"] = originalKey;
  });

  it("decryption of tampered ciphertext fails", () => {
    const original = "sk-gemini-test-key";
    const { encrypted, iv } = encryptApiKey(original);

    // Tamper with the ciphertext (flip some hex chars)
    const tampered = encrypted.slice(0, -4) + "0000";

    expect(() => {
      decryptApiKey(tampered, iv);
    }).toThrow(); // Auth tag mismatch
  });

  it("handles empty string correctly", () => {
    const { encrypted, iv } = encryptApiKey("");
    const decrypted = decryptApiKey(encrypted, iv);
    expect(decrypted).toBe("");
  });

  it("handles long API keys correctly", () => {
    const longKey = "sk-ant-api03-" + "x".repeat(200);
    const { encrypted, iv } = encryptApiKey(longKey);
    const decrypted = decryptApiKey(encrypted, iv);
    expect(decrypted).toBe(longKey);
  });
});

describe("maskApiKey", () => {
  it("returns last 4 chars with bullet prefix", () => {
    // "sk-ant-api03-abc123xyz789" -> last 4 = "z789"
    expect(maskApiKey("sk-ant-api03-abc123xyz789")).toBe("••••z789");
  });

  it("masks API key to show only last 4 characters", () => {
    const key = "sk-openai-abcdefgh1234";
    const masked = maskApiKey(key);
    expect(masked).toMatch(/^••••/);
    expect(masked).toMatch(/1234$/);
  });

  it("short keys return bullets only", () => {
    expect(maskApiKey("abc")).toBe("••••");
    expect(maskApiKey("")).toBe("••••");
  });

  it("exactly 4 char key returns bullets only", () => {
    const masked = maskApiKey("abcd");
    expect(masked).toBe("••••");
  });
});

describe("encryption key validation", () => {
  it("auto-bootstraps ENCRYPTION_KEY from ~/.codeaudit-ai/.env if not set", () => {
    const original = process.env["ENCRYPTION_KEY"];
    delete process.env["ENCRYPTION_KEY"];

    // Should not throw — auto-creates key file
    expect(() => encryptApiKey("test")).not.toThrow();
    // Key should now be set in process.env
    expect(process.env["ENCRYPTION_KEY"]).toBeDefined();
    expect(process.env["ENCRYPTION_KEY"]!.length).toBe(64);

    process.env["ENCRYPTION_KEY"] = original;
  });

  it("throws if ENCRYPTION_KEY is wrong length", () => {
    const original = process.env["ENCRYPTION_KEY"];
    process.env["ENCRYPTION_KEY"] = "tooshort";

    expect(() => encryptApiKey("test")).toThrow(/64-character/);

    process.env["ENCRYPTION_KEY"] = original;
  });
});
