import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const DB_DIR = path.join(os.homedir(), ".codeaudit");
const DB_PATH = process.env["DATABASE_PATH"] ?? path.join(DB_DIR, "codeaudit.db");

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    const sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    _db = drizzle(sqlite, { schema });
  }
  return _db;
}

export type DbClient = ReturnType<typeof getDb>;
