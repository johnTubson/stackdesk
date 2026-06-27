import { count, desc, eq } from "drizzle-orm";

import { getDb } from "#/db/client";
import { auditLogs, users } from "#/db/schema";
import { requireAdmin } from "#/lib/session";
import type { auditListSearchSchema } from "#/lib/validators";
import { readAppSession } from "#/server/session.server";
import type { z } from "zod";

const PAGE_SIZE = 15;

type AuditMetadata = {
  note?: string;
  previousStatus?: string;
  nextStatus?: string;
  batchTotal?: number;
  transactionSum?: number;
  difference?: number;
  documentCount?: number;
  businessName?: string;
};

type AuditListInput = z.infer<typeof auditListSearchSchema>;

export async function listAuditLogsImpl(data: AuditListInput) {
  requireAdmin(await readAppSession());
  const db = getDb();

  const items = db
    .select({
      id: auditLogs.id,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      action: auditLogs.action,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(PAGE_SIZE)
    .offset((data.page - 1) * PAGE_SIZE)
    .all()
    .map((entry) => ({
      ...entry,
      metadata: entry.metadata as AuditMetadata | null,
    }));

  const totalRow = db.select({ value: count() }).from(auditLogs).get();
  const total = totalRow?.value ?? 0;

  return {
    items,
    page: data.page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}
