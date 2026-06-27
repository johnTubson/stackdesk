import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { payoutBatches, transactions } from "#/db/schema";
import { resetDb } from "#/db/client";
import {
  getBatchImpl,
  listBatchesImpl,
  resolveDiscrepancyImpl,
} from "#/server/reconciliation.server";
import { readAppSession } from "#/server/session.server";
import {
  adminSession,
  reviewerSession,
  seedTestUser,
  setupTestDb,
} from "#/test/setup-db";

vi.mock("#/server/session.server", () => ({
  readAppSession: vi.fn(),
}));

describe("reconciliation.server", () => {
  let batchId = "";

  beforeEach(() => {
    const { db } = setupTestDb();
    seedTestUser(db);

    const batch = db
      .insert(payoutBatches)
      .values({
        reference: "BATCH-TEST-001",
        totalAmount: 10_000,
        status: "discrepancy",
      })
      .returning()
      .get();

    batchId = batch.id;

    db.insert(transactions)
      .values([
        {
          reference: "TXN-001",
          amount: 4_000,
          batchId: batch.id,
          status: "settled",
        },
        {
          reference: "TXN-002",
          amount: 4_000,
          batchId: batch.id,
          status: "settled",
        },
      ])
      .run();

    vi.mocked(readAppSession).mockResolvedValue(reviewerSession);
  });

  afterEach(() => {
    resetDb();
    vi.clearAllMocks();
  });

  it("lists batches with discrepancy flag", async () => {
    const result = await listBatchesImpl({ status: "all", page: 1 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.hasDiscrepancy).toBe(true);
    expect(result.items[0]?.difference).toBe(2_000);
  });

  it("returns batch detail with transaction sum", async () => {
    const result = await getBatchImpl({ batchId });

    expect(result.batch.reference).toBe("BATCH-TEST-001");
    expect(result.transactionSum).toBe(8_000);
    expect(result.hasDiscrepancy).toBe(true);
    expect(result.transactions).toHaveLength(2);
  });

  it("resolves discrepancy batch and writes audit metadata", async () => {
    await resolveDiscrepancyImpl({
      batchId,
      note: "Adjusted for missing settlement.",
    });

    const updated = await getBatchImpl({ batchId });
    expect(updated.batch.status).toBe("resolved");
    expect(updated.activity).toHaveLength(1);
    expect(updated.activity[0]?.action).toBe("batch.discrepancy.resolved");
  });

  it("rejects resolve when batch is not discrepancy", async () => {
    const { db } = setupTestDb();
    seedTestUser(db);

    const openBatch = db
      .insert(payoutBatches)
      .values({
        reference: "BATCH-OPEN",
        totalAmount: 5_000,
        status: "open",
      })
      .returning()
      .get();

    vi.mocked(readAppSession).mockResolvedValue(adminSession);

    await expect(
      resolveDiscrepancyImpl({
        batchId: openBatch.id,
        note: "Should fail",
      })
    ).rejects.toThrow("Only discrepancy batches can be resolved");
  });
});
