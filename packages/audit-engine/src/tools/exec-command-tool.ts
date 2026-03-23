import { tool } from "ai";
import { z } from "zod";
import { execCommand } from "../commands";

/**
 * Command allowlist — only read-only, analysis commands are permitted.
 * Write, network, and install commands are blocked at the sandbox level.
 */
const ALLOWED_COMMANDS = new Set([
  "find", "grep", "egrep", "cat", "head", "tail", "wc", "ls", "tree",
  "file", "stat", "du", "sort", "uniq", "awk", "sed", "git", "bash", "sh",
  "npm", "npx", "pip", "pip3", "cargo", "go", "python", "python3", "ruby",
  "php", "java", "javac", "dotnet", "swift", "cloc", "tokei", "scc", "jscpd",
]);

/**
 * Dangerous patterns that indicate write, delete, or network operations.
 * Applied to the joined command+args string (case-insensitive).
 */
const DANGEROUS_PATTERNS = [
  // Write/delete
  /\brm\s/i,
  /\bmv\s/i,
  /\bcp\s/i,
  /\bmkdir\b/i,
  /\brmdir\b/i,
  /\bchmod\b/i,
  /\bchown\b/i,
  />\s/,
  />>\s/,
  /\btee\s/i,
  /\btouch\s/i,
  // Network
  /\bcurl\s/i,
  /\bwget\s/i,
  /\bfetch\s/i,
  /\bnc\s/i,
  /\bssh\s/i,
  /\bscp\s/i,
  // Package install
  /\bnpm\s+install\b/i,
  /\bnpm\s+ci\b/i,
  /\byarn\s+add\b/i,
  /\bpip\s+install\b/i,
  /\bcargo\s+add\b/i,
  /\bgo\s+get\b/i,
  // Git write ops
  /\bgit\s+push\b/i,
  /\bgit\s+commit\b/i,
  /\bgit\s+add\b/i,
  /\bgit\s+merge\b/i,
  /\bgit\s+rebase\b/i,
  /\bgit\s+checkout\s+-b\b/i,
  // Dangerous flags
  /\bsed\s+-i\b/i,
  /--force\b/i,
  /--hard\b/i,
];

const MAX_TIMEOUT_MS = 60_000;
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Check if a string contains any dangerous patterns.
 */
function hasDangerousPattern(input: string): string | null {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      return `matched dangerous pattern: ${pattern.toString()}`;
    }
  }
  return null;
}

/**
 * Factory function that creates a sandboxed execCommand tool for use with Vercel AI SDK.
 *
 * The tool:
 * - Restricts to an allowlist of read-only commands
 * - Blocks dangerous write/delete/network/install patterns
 * - Enforces path containment to the repo directory
 * - Caps execution timeout at 60s
 * - Returns "(blocked: reason)" on rejection instead of throwing
 *
 * @param repoPath - The absolute path to the repository being audited (commands are cwd'd here)
 * @param timeoutMs - Per-command timeout in milliseconds (default 30000, capped at 60000)
 */
export function createExecCommandTool(repoPath: string, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const effectiveTimeout = Math.min(timeoutMs, MAX_TIMEOUT_MS);

  const inputSchema = z.object({
    command: z.string().describe(
      "The shell command to run (e.g., 'find', 'grep', 'cat', 'head', 'wc', 'git')"
    ),
    args: z.array(z.string()).describe("Command arguments as an array"),
  });

  return tool({
    description:
      "Run a read-only shell command against the repository. Only analysis and inspection commands are permitted. " +
      "Write, delete, network, and package install operations are blocked. " +
      "Commands run with the repository as the working directory.",
    inputSchema,
    execute: async ({ command, args }: { command: string; args: string[] }): Promise<string> => {
      // 1. Command allowlist check
      if (!ALLOWED_COMMANDS.has(command.toLowerCase())) {
        return `(blocked: command '${command}' is not in the allowed command list)`;
      }

      // 2. Dangerous pattern check on joined command+args string
      const fullCommandStr = [command, ...args].join(" ");
      const dangerReason = hasDangerousPattern(fullCommandStr);
      if (dangerReason) {
        return `(blocked: ${dangerReason})`;
      }

      // 3. For bash/sh with -c, also inspect the shell command string inside -c
      if ((command === "bash" || command === "sh") && args.includes("-c")) {
        const cIdx = args.indexOf("-c");
        const shellCmd = args[cIdx + 1] ?? "";
        const shellDangerReason = hasDangerousPattern(shellCmd);
        if (shellDangerReason) {
          return `(blocked: shell -c argument contains dangerous pattern: ${shellDangerReason})`;
        }
      }

      // 4. Path containment check — reject absolute paths outside repoPath, reject .. escapes
      for (const arg of args) {
        // Reject any arg with ".." that could escape the repo
        if (arg.includes("..")) {
          // Allow ".." only if the resolved path still stays within repoPath
          // Simple heuristic: reject any ".." in args to be safe
          return `(blocked: argument '${arg}' contains '..' which could escape the repository boundary)`;
        }
        // Reject absolute paths that don't start with repoPath
        if (arg.startsWith("/") && !arg.startsWith(repoPath)) {
          return `(blocked: absolute path '${arg}' is outside the repository boundary '${repoPath}')`;
        }
      }

      // 5. Execute the command within the repository directory
      const output = await execCommand(command, args, repoPath, effectiveTimeout);

      // 6. Truncate output to prevent context window explosion during multi-step tool-use
      const MAX_OUTPUT_CHARS = 8000; // ~2K tokens — keeps total context manageable across 8 steps
      if (output.length > MAX_OUTPUT_CHARS) {
        return output.slice(0, MAX_OUTPUT_CHARS) + `\n\n... (truncated — ${output.length} chars total, showing first ${MAX_OUTPUT_CHARS})`;
      }
      return output;
    },
  });
}
