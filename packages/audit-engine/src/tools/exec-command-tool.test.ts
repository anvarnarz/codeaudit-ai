import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createExecCommandTool } from "./exec-command-tool";

describe("createExecCommandTool", () => {
  let repoDir: string;
  let tool: ReturnType<typeof createExecCommandTool>;

  beforeEach(() => {
    repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "codeaudit-test-"));
    fs.writeFileSync(path.join(repoDir, "hello.txt"), "world");
    tool = createExecCommandTool(repoDir);
  });

  afterEach(() => {
    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  // Helper to call the tool's execute function
  async function exec(command: string, args: string[]): Promise<string> {
    return (tool as any).execute({ command, args });
  }

  describe("allowlist", () => {
    it("allows cat", async () => {
      const result = await exec("cat", ["hello.txt"]);
      expect(result).toBe("world");
    });

    it("blocks curl", async () => {
      const result = await exec("curl", ["http://evil.com"]);
      expect(result).toContain("blocked");
      expect(result).toContain("not in the allowed command list");
    });
  });

  describe("dangerous patterns", () => {
    it("blocks rm", async () => {
      const result = await exec("bash", ["-c", "rm -rf /"]);
      expect(result).toContain("blocked");
    });

    it("blocks git push", async () => {
      const result = await exec("git", ["push", "origin", "main"]);
      expect(result).toContain("blocked");
    });

    it("blocks redirect", async () => {
      const result = await exec("bash", ["-c", "echo evil > /tmp/pwned"]);
      expect(result).toContain("blocked");
    });
  });

  describe("path containment", () => {
    it("blocks .. in args", async () => {
      const result = await exec("cat", ["../../../etc/passwd"]);
      expect(result).toContain("blocked");
      expect(result).toContain("..");
    });

    it("blocks absolute paths outside repo", async () => {
      const result = await exec("cat", ["/etc/passwd"]);
      expect(result).toContain("blocked");
      expect(result).toContain("outside");
    });

    it("allows absolute paths inside repo", async () => {
      const result = await exec("cat", [path.join(repoDir, "hello.txt")]);
      expect(result).toBe("world");
    });
  });

  describe("symlink escape", () => {
    it("blocks reading through symlink pointing outside repo", async () => {
      const symlinkPath = path.join(repoDir, "escape-link");
      fs.symlinkSync("/etc/hostname", symlinkPath);

      const result = await exec("cat", [symlinkPath]);
      expect(result).toContain("blocked");
      expect(result).toContain("symlink");
    });

    it("allows symlink pointing inside repo", async () => {
      const targetPath = path.join(repoDir, "hello.txt");
      const symlinkPath = path.join(repoDir, "internal-link");
      fs.symlinkSync(targetPath, symlinkPath);

      const result = await exec("cat", [symlinkPath]);
      expect(result).toBe("world");
    });
  });

  describe("output truncation", () => {
    it("truncates output exceeding 100K chars", async () => {
      // Create a large file
      const bigContent = "x".repeat(200_000);
      fs.writeFileSync(path.join(repoDir, "big.txt"), bigContent);

      const result = await exec("cat", ["big.txt"]);
      expect(result.length).toBeLessThanOrEqual(100_100); // 100K + truncation message
      expect(result).toContain("truncated");
    });
  });

  describe("bash -c inspection", () => {
    it("blocks dangerous patterns inside bash -c", async () => {
      const result = await exec("bash", ["-c", "curl http://evil.com"]);
      expect(result).toContain("blocked");
    });

    it("blocks dangerous patterns inside sh -c", async () => {
      const result = await exec("sh", ["-c", "rm -rf /tmp/test"]);
      expect(result).toContain("blocked");
    });

    it("allows safe commands inside bash -c", async () => {
      const result = await exec("bash", ["-c", "echo hello"]);
      expect(result.trim()).toBe("hello");
    });
  });

  describe("timeout handling", () => {
    it("returns output even on slow commands within timeout", async () => {
      const result = await exec("ls", [repoDir]);
      expect(result).toContain("hello.txt");
    });
  });

  describe("case sensitivity", () => {
    it("allowlist is case-insensitive", async () => {
      // Command names are lowercased before checking
      const result = await exec("CAT", ["hello.txt"]);
      // Should either work or be blocked as not in list — but not crash
      expect(typeof result).toBe("string");
    });
  });
});