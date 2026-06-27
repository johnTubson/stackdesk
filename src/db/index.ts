import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

export function resolveDbPath(
  url = process.env.DATABASE_URL ?? "file:./local.db"
) {
  return url.replace(/^file:/, "");
}

export function createDb(url = process.env.DATABASE_URL ?? "file:./local.db") {
  const client = new Database(resolveDbPath(url));
  client.pragma("journal_mode = WAL");
  client.pragma("foreign_keys = ON");
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;
