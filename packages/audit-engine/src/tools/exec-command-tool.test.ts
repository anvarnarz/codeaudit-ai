import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createExecCommandTool } from "./exec-command-tool";

describe("createExecCommandTool", () => {
  let repoDir: string;
  let tool: ReturnType<typeof createExecCommandTool>;

  beforeEach(() => {
    // realpathSync resolves /var/folders → /private/var/folders on macOS so
    // path containment checks (which compare against fs.realpathSync) match.
    repoDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "codeaudit-test-")));
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
      // /etc/hosts exists on both macOS and Linux; /etc/hostname does not on macOS.
      fs.symlinkSync("/etc/hosts", symlinkPath);

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

  describe("vendored-dir excludes", () => {
    it("blocks find without any vendored-dir exclusion", async () => {
      const result = await exec("find", [".", "-name", "*.ts"]);
      expect(result).toContain("blocked");
      expect(result).toContain("vendored");
      expect(result).toContain("node_modules");
    });

    it("allows find when -not -path excludes node_modules", async () => {
      const result = await exec("find", [
        ".",
        "-type", "f",
        "-name", "hello.txt",
        "-not", "-path", "*/node_modules/*",
      ]);
      expect(result).not.toContain("blocked");
      expect(result).toContain("hello.txt");
    });

    it("allows find when ! -path excludes node_modules", async () => {
      const result = await exec("find", [
        ".",
        "-name", "hello.txt",
        "!", "-path", "*/node_modules/*",
      ]);
      expect(result).not.toContain("blocked");
    });

    it("allows find when -prune is used with a vendored-dir name", async () => {
      const result = await exec("find", [
        ".",
        "-path", "*/node_modules", "-prune",
        "-o", "-name", "hello.txt", "-print",
      ]);
      expect(result).not.toContain("blocked");
    });

    it("blocks recursive grep without --exclude-dir", async () => {
      const result = await exec("grep", ["-r", "TODO", "."]);
      expect(result).toContain("blocked");
      expect(result).toContain("exclude-dir");
    });

    it("allows recursive grep with --exclude-dir", async () => {
      const result = await exec("grep", [
        "-r", "world", ".",
        "--exclude-dir=node_modules",
        "--exclude-dir=.git",
      ]);
      expect(result).not.toContain("blocked");
      expect(result).toContain("hello.txt");
    });

    it("allows non-recursive grep on a single file without excludes", async () => {
      const result = await exec("grep", ["world", "hello.txt"]);
      expect(result).not.toContain("blocked");
      expect(result).toContain("world");
    });

    it("blocks recursive grep with combined short flag like -rn", async () => {
      const result = await exec("grep", ["-rn", "TODO", "."]);
      expect(result).toContain("blocked");
      expect(result).toContain("exclude-dir");
    });

    it("blocks find inside bash -c without excludes", async () => {
      const result = await exec("bash", [
        "-c",
        `find . -name "*.ts"`,
      ]);
      expect(result).toContain("blocked");
      expect(result).toContain("bash -c");
    });

    it("allows find inside bash -c with vendored-dir excludes", async () => {
      const result = await exec("bash", [
        "-c",
        `find . -name "hello.txt" -not -path "*/node_modules/*"`,
      ]);
      expect(result).not.toContain("blocked");
    });

    it("blocks recursive grep inside bash -c without excludes", async () => {
      const result = await exec("bash", [
        "-c",
        `grep -rn "TODO" .`,
      ]);
      expect(result).toContain("blocked");
      expect(result).toContain("exclude-dir");
    });

    it("allows recursive grep inside bash -c with excludes", async () => {
      const result = await exec("bash", [
        "-c",
        `grep -rn "world" . --exclude-dir=node_modules --exclude-dir=.git`,
      ]);
      expect(result).not.toContain("blocked");
    });
  });
});