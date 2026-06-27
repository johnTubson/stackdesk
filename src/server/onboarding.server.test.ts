import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { eq } from "drizzle-orm";

import { merchantDocuments, merchants } from "#/db/schema";
import { resetDb } from "#/db/client";
import {
  saveOnboardingStepImpl,
  submitOnboardingImpl,
} from "#/server/onboarding.server";
import { readAppSession } from "#/server/session.server";
import { reviewerSession, seedTestUser, setupTestDb } from "#/test/setup-db";

vi.mock("#/server/session.server", () => ({
  readAppSession: vi.fn(),
}));

describe("onboarding.server", () => {
  let db: ReturnType<typeof setupTestDb>["db"];

  beforeEach(() => {
    const setup = setupTestDb();
    db = setup.db;
    seedTestUser(db);
    vi.mocked(readAppSession).mockResolvedValue(reviewerSession);
  });

  afterEach(() => {
    resetDb();
    vi.clearAllMocks();
  });

  it("creates draft merchant on step 1", async () => {
    const result = await saveOnboardingStepImpl({
      step: 1,
      businessName: "New Co",
      category: "SaaS",
    });

    expect(result.merchantId).toBeTruthy();
  });

  it("submits onboarding as pending merchant", async () => {
    const step1 = await saveOnboardingStepImpl({
      step: 1,
      businessName: "Pending Co",
      category: "Retail",
    });

    await saveOnboardingStepImpl({
      step: 2,
      merchantId: step1.merchantId,
      contactEmail: "ops@pending.demo",
    });

    await saveOnboardingStepImpl({
      step: 3,
      merchantId: step1.merchantId,
      documents: [
        { type: "identity", fileName: "id.pdf" },
        { type: "bank_statement", fileName: "bank.pdf" },
      ],
    });

    const submit = await submitOnboardingImpl({
      merchantId: step1.merchantId,
    });

    expect(submit.success).toBe(true);

    const merchant = db
      .select()
      .from(merchants)
      .where(eq(merchants.id, step1.merchantId))
      .get();

    expect(merchant?.status).toBe("pending");
    expect(merchant?.submittedAt).toBeTruthy();

    const docs = db
      .select()
      .from(merchantDocuments)
      .where(eq(merchantDocuments.merchantId, step1.merchantId))
      .all();

    expect(docs).toHaveLength(2);
  });
});
