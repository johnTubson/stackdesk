import { and, count, desc, eq, sql } from "drizzle-orm";

import { getDb } from "#/db/client";
import { auditLogs, payoutBatches, transactions, users } from "#/db/schema";
import { requireReviewer } from "#/lib/session";
import type {
  batchIdSchema,
  batchListSearchSchema,
  resolveDiscrepancySchema,
} from "#/lib/validators";
import { readAppSession } from "#/server/session.server";
import type { z } from "zod";

const PAGE_SIZE = 10;

type BatchListInput = z.infer<typeof batchListSearchSchema>;
type BatchIdInput = z.infer<typeof batchIdSchema>;
type ResolveInput = z.infer<typeof resolveDiscrepancySchema>;

type BatchAuditMetadata = {
  note?: string;
  previousStatus?: string;
  nextStatus?: string;
  batchTotal?: number;
  transactionSum?: number;
  difference?: number;
};

function sumTransactionAmounts(batchId: string) {
  const db = getDb();
  const row = db
    .select({
      total: sql<number>`coalesce(sum(${transactions.amount}), 0)`.mapWith(
        Number
      ),
    })
    .from(transactions)
    .where(eq(transactions.batchId, batchId))
    .get();

  return row?.total ?? 0;
}

export async function listBatchesImpl(data: BatchListInput) {
  requireReviewer(await readAppSession());
  const db = getDb();

  const whereClause =
    data.status === "all" ? undefined : eq(payoutBatches.status, data.status);

  const items = db
    .select({
      id: payoutBatches.id,
      reference: payoutBatches.reference,
      totalAmount: payoutBatches.totalAmount,
      status: payoutBatches.status,
      createdAt: payoutBatches.createdAt,
    })
    .from(payoutBatches)
    .where(whereClause)
    .orderBy(desc(payoutBatches.createdAt))
    .limit(PAGE_SIZE)
    .offset((data.page - 1) * PAGE_SIZE)
    .all()
    .map((batch) => {
      const transactionSum = sumTransactionAmounts(batch.id);
      const hasDiscrepancy = transactionSum !== batch.totalAmount;

      return {
        ...batch,
        transactionSum,
        hasDiscrepancy,
        difference: batch.totalAmount - transactionSum,
      };
    });

  const totalRow = db
    .select({ value: count() })
    .from(payoutBatches)
    .where(whereClause)
    .get();

  const total = totalRow?.value ?? 0;

  return {
    items,
    page: data.page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getBatchImpl(data: BatchIdInput) {
  requireReviewer(await readAppSession());
  const db = getDb();

  const batch = db
    .select()
    .from(payoutBatches)
    .where(eq(payoutBatches.id, data.batchId))
    .get();

  if (!batch) {
    throw new Error("Batch not found");
  }

  const batchTransactions = db
    .select()
    .from(transactions)
    .where(eq(transactions.batchId, batch.id))
    .orderBy(desc(transactions.createdAt))
    .all();

  const transactionSum = batchTransactions.reduce(
    (sum, txn) => sum + txn.amount,
    0
  );
  const hasDiscrepancy = transactionSum !== batch.totalAmount;
  const difference = batch.totalAmount - transactionSum;

  const activity = db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .where(
      and(eq(auditLogs.entityType, "batch"), eq(auditLogs.entityId, batch.id))
    )
    .orderBy(desc(auditLogs.createdAt))
    .all()
    .map((entry) => ({
      ...entry,
      metadata: entry.metadata as BatchAuditMetadata | null,
    }));

  return {
    batch,
    transactions: batchTransactions,
    transactionSum,
    hasDiscrepancy,
    difference,
    activity,
  };
}

export async function resolveDiscrepancyImpl(data: ResolveInput) {
  const session = requireReviewer(await readAppSession());
  const db = getDb();

  const batch = db
    .select()
    .from(payoutBatches)
    .where(eq(payoutBatches.id, data.batchId))
    .get();

  if (!batch) {
    throw new Error("Batch not found");
  }

  if (batch.status !== "discrepancy") {
    throw new Error("Only discrepancy batches can be resolved");
  }

  const transactionSum = sumTransactionAmounts(batch.id);

  db.transaction((tx) => {
    tx.update(payoutBatches)
      .set({ status: "resolved" })
      .where(eq(payoutBatches.id, data.batchId))
      .run();

    tx.insert(auditLogs)
      .values({
        entityType: "batch",
        entityId: data.batchId,
        action: "batch.discrepancy.resolved",
        actorId: session.userId,
        metadata: {
          note: data.note,
          previousStatus: batch.status,
          nextStatus: "resolved",
          batchTotal: batch.totalAmount,
          transactionSum,
          difference: batch.totalAmount - transactionSum,
        },
      })
      .run();
  });

  return { success: true as const };
}
