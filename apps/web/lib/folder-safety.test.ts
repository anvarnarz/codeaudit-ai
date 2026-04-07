/**
 * Tests for folder-safety.ts service library.
 * Tests are written before implementation (TDD).
 */
import { describe, it, expect, vi } from "vitest";

// Mock node built-ins before importing the module
vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

vi.mock("node:util", () => ({
  promisify: (fn: unknown) => fn,
}));

vi.mock("node:fs/promises", () => ({
  default: {
    access: vi.fn(),
    mkdir: vi.fn(),
  },
}));

vi.mock("node:path", async () => {
  const actual = await vi.importActual("node:path");
  return actual;
});

vi.mock("node:os", () => ({
  default: {
    homedir: () => "/Users/test",
  },
}));

describe("folder-safety", () => {
  describe("isGitRepo", () => {
    it("returns true when .git directory exists", async () => {
      const { default: fs } = await import("node:fs/promises");
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const { isGitRepo } = await import("./folder-safety");
      const result = await isGitRepo("/some/path");
      expect(result).toBe(true);
    });

    it("returns false when .git directory does not exist", async () => {
      const { default: fs } = await import("node:fs/promises");
      vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));

      const { isGitRepo } = await import("./folder-safety");
      const result = await isGitRepo("/some/non-git-path");
      expect(result).toBe(false);
    });
  });

  describe("lockFolder", () => {
    it("calls git push block BEFORE lock chmod for git repos (CRITICAL ORDER)", async () => {
      const { execFile } = await import("node:child_process");
      const { default: fs } = await import("node:fs/promises");

      // isGitRepo returns true
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const callOrder: string[] = [];
      vi.mocked(execFile).mockImplementation((cmd: any, args: any) => {
        if (cmd === "git") callOrder.push("git-push-block");
        // Track chmod calls with their mode to distinguish safety-unlock from lock
        if (cmd === "chmod" && Array.isArray(args)) {
          if (args.includes("a-w")) callOrder.push("chmod-lock");
          else callOrder.push("chmod-unlock");
        }
        return Promise.resolve({ stdout: "", stderr: "" }) as unknown as ReturnType<typeof execFile>;
      });

      const { lockFolder } = await import("./folder-safety");
      await lockFolder("/some/git-repo");

      // Safety unlock (chmod u+w) happens first, then git push block, then chmod a-w
      const gitIdx = callOrder.indexOf("git-push-block");
      const lockIdx = callOrder.indexOf("chmod-lock");
      expect(gitIdx).toBeGreaterThanOrEqual(0);
      expect(lockIdx).toBeGreaterThanOrEqual(0);
      expect(gitIdx).toBeLessThan(lockIdx);
    });

    it("skips git push block for non-git repos", async () => {
      const { execFile } = await import("node:child_process");
      const { default: fs } = await import("node:fs/promises");

      // isGitRepo returns false
      vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));

      const gitCalls: string[] = [];
      vi.mocked(execFile).mockImplementation((cmd: any) => {
        if (cmd === "git") gitCalls.push("git");
        return Promise.resolve({ stdout: "", stderr: "" }) as unknown as ReturnType<typeof execFile>;
      });

      const { lockFolder } = await import("./folder-safety");
      await lockFolder("/some/non-git");

      expect(gitCalls).toHaveLength(0);
    });

    it("uses set-url --push with no_push for git push block", async () => {
      const { execFile } = await import("node:child_process");
      const { default: fs } = await import("node:fs/promises");

      vi.mocked(fs.access).mockResolvedValue(undefined);

      let capturedGitArgs: string[] = [];
      vi.mocked(execFile).mockImplementation((cmd: any, args: any) => {
        if (cmd === "git") capturedGitArgs = args;
        return Promise.resolve({ stdout: "", stderr: "" }) as unknown as ReturnType<typeof execFile>;
      });

      const { lockFolder } = await import("./folder-safety");
      await lockFolder("/some/git-repo");

      expect(capturedGitArgs).toContain("set-url");
      expect(capturedGitArgs).toContain("--push");
      expect(capturedGitArgs).toContain("no_push");
    });
  });

  describe("unlockFolder", () => {
    it("calls chmod -R u+w to restore owner write bits only", async () => {
      const { execFile } = await import("node:child_process");

      let capturedArgs: string[] = [];
      vi.mocked(execFile).mockImplementation((cmd: any, args: any) => {
        if (cmd === "chmod") capturedArgs = args;
        return Promise.resolve({ stdout: "", stderr: "" }) as unknown as ReturnType<typeof execFile>;
      });

      const { unlockFolder } = await import("./folder-safety");
      await unlockFolder("/some/path");

      expect(capturedArgs).toContain("-R");
      expect(capturedArgs).toContain("u+w");
      expect(capturedArgs).not.toContain("a+w"); // must NOT restore group/other write bits
    });
  });

  describe("createAuditOutputDir", () => {
    it("creates directory under home dir with audit- prefix and timestamp", async () => {
      const { default: fs } = await import("node:fs/promises");
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      const { createAuditOutputDir } = await import("./folder-safety");
      const result = await createAuditOutputDir("/some/path/my-repo");

      expect(result).toMatch(/^\/Users\/test\/audit-my-repo-\d{8}-\d{4}$/);
    });

    it("creates directory with recursive: true", async () => {
      const { default: fs } = await import("node:fs/promises");

      let capturedOptions: object = {};
      vi.mocked(fs.mkdir).mockImplementation((_path: any, options: any) => {
        capturedOptions = options as object;
        return Promise.resolve(undefined);
      });

      const { createAuditOutputDir } = await import("./folder-safety");
      await createAuditOutputDir("/some/path/my-repo");

      expect((capturedOptions as { recursive: boolean }).recursive).toBe(true);
    });

    it("returns the created directory path", async () => {
      const { default: fs } = await import("node:fs/promises");
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      const { createAuditOutputDir } = await import("./folder-safety");
      const result = await createAuditOutputDir("/Users/test/projects/code-audit");

      expect(result).toMatch(/\/Users\/test\/audit-code-audit-/);
    });
  });
});
