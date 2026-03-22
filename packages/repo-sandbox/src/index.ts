/**
 * @codeaudit-ai/repo-sandbox
 *
 * Secure repository cloning and read-only sandbox isolation.
 *
 * Safety model (mirrors the existing CLI process):
 *   1. Filesystem lock — clones into a temp directory with read-only permissions
 *   2. No push access — git config disables all push operations
 *   3. Network isolation — worker container has no access to production URLs
 *
 * Uses simple-git (wraps system git binary) for token-in-URL HTTPS cloning:
 *   https://x-access-token:{token}@github.com/{owner}/{repo}.git
 *
 * Access tokens come from GitHub App installation tokens (not OAuth tokens).
 * Tokens are retrieved server-side from the database — never from session cookies.
 *
 * Implemented in Phase 3.
 */

export type CloneOptions = {
  repoFullName: string; // e.g. "owner/repo"
  githubToken: string; // GitHub App installation token — never log this
  targetDir?: string; // defaults to OS temp dir
  shallow?: boolean; // shallow clone for quick scan mode
};

export type SandboxedRepo = {
  path: string;
  cleanup: () => Promise<void>;
};

// Placeholder — implemented in Phase 3
export async function cloneToSandbox(_options: CloneOptions): Promise<never> {
  throw new Error("RepoSandbox not yet implemented — coming in Phase 3");
}
