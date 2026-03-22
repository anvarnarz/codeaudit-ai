#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import os from "node:os";
import crypto from "node:crypto";

// Auto-generate ENCRYPTION_KEY on first run (persisted to ~/.codeaudit/.env)
const envDir = path.join(os.homedir(), ".codeaudit");
const envFile = path.join(envDir, ".env");
if (!process.env["ENCRYPTION_KEY"]) {
  fs.mkdirSync(envDir, { recursive: true });
  let envContents = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : "";
  if (!envContents.includes("ENCRYPTION_KEY=")) {
    const key = crypto.randomBytes(32).toString("hex");
    envContents += `\nENCRYPTION_KEY=${key}\n`;
    fs.writeFileSync(envFile, envContents, { mode: 0o600 });
  }
  // Load the key into this process so it propagates via spawn env
  const match = envContents.match(/ENCRYPTION_KEY=([^\n]+)/);
  if (match) process.env["ENCRYPTION_KEY"] = match[1].trim();
}

const PORT = process.env["PORT"] ?? "3000";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// In monorepo: CLI is at packages/cli/, Next.js app is at apps/web/
const APP_DIR = path.resolve(__dirname, "../../apps/web");

// Start Next.js dev server
const nextBin = path.join(APP_DIR, "node_modules", ".bin", "next");
const server = spawn(nextBin, ["dev", "--port", PORT], {
  cwd: APP_DIR,
  env: { ...process.env, PORT },
  stdio: "inherit",
});

server.on("error", (err) => {
  console.error("[codeaudit] Failed to start server:", err.message);
  process.exit(1);
});

// Poll /api/health until server is ready, then open browser
async function waitAndOpen() {
  const healthUrl = `http://localhost:${PORT}/api/health`;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(healthUrl);
      if (res.ok) {
        const { default: open } = await import("open");
        await open(`http://localhost:${PORT}`);
        return;
      }
    } catch {
      // Not ready yet — continue polling
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.error("[codeaudit] Server did not become ready in 30s");
}

waitAndOpen().catch(console.error);

process.on("SIGINT", () => {
  server.kill();
  process.exit(0);
});
process.on("SIGTERM", () => {
  server.kill();
  process.exit(0);
});
