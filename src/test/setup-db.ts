import { readFileSync } from "node:fs";
import { join } from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { resetDb } from "#/db/client";
import * as schema from "#/db/schema";

export function setupTestDb() {
  const client = new Database(":memory:");
  client.pragma("foreign_keys = ON");

  const migrationPath = join(
    process.cwd(),
    "src/db/migrations/0001_core_domain.sql"
  );
  const sql = readFileSync(migrationPath, "utf8");

  for (const statement of sql.split("--> statement-breakpoint")) {
    const trimmed = statement.trim();
    if (trimmed) {
      client.exec(trimmed);
    }
  }

  const db = drizzle(client, { schema });
  resetDb(db);

  return { db, client };
}

export const adminSession = {
  userId: "admin-user-id",
  email: "admin@stackdesk.demo",
  name: "Demo Admin",
  role: "admin" as const,
};

export const reviewerSession = {
  userId: "reviewer-user-id",
  email: "reviewer@stackdesk.demo",
  name: "Demo Reviewer",
  role: "reviewer" as const,
};

export function seedTestUser(db: ReturnType<typeof setupTestDb>["db"]) {
  db.insert(schema.users)
    .values({
      id: adminSession.userId,
      email: adminSession.email,
      passwordHash: "hash",
      name: adminSession.name,
      role: "admin",
    })
    .run();

  db.insert(schema.users)
    .values({
      id: reviewerSession.userId,
      email: reviewerSession.email,
      passwordHash: "hash",
      name: reviewerSession.name,
      role: "reviewer",
    })
    .run();
}
