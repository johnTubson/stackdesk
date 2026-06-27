import { and, desc, eq } from "drizzle-orm";

import { getDb } from "#/db/client";
import { auditLogs, merchantDocuments, merchants } from "#/db/schema";
import { writeAuditLog } from "#/lib/audit";
import { requireReviewer } from "#/lib/session";
import type {
  onboardingStepSchema,
  submitOnboardingSchema,
} from "#/lib/validators";
import { readAppSession } from "#/server/session.server";
import type { z } from "zod";

type OnboardingStepInput = z.infer<typeof onboardingStepSchema>;
type SubmitOnboardingInput = z.infer<typeof submitOnboardingSchema>;

function assertDraftMerchant(merchantId: string) {
  const db = getDb();
  const merchant = db
    .select()
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .get();

  if (!merchant) {
    throw new Error("Merchant not found");
  }

  if (merchant.status !== "draft") {
    throw new Error("Only draft merchants can be edited in onboarding");
  }

  return merchant;
}

export async function saveOnboardingStepImpl(data: OnboardingStepInput) {
  const session = requireReviewer(await readAppSession());
  const db = getDb();

  if (data.step === 1) {
    if (data.merchantId) {
      assertDraftMerchant(data.merchantId);
      db.update(merchants)
        .set({
          businessName: data.businessName,
          category: data.category,
          updatedAt: new Date(),
        })
        .where(eq(merchants.id, data.merchantId))
        .run();

      return { merchantId: data.merchantId };
    }

    const merchant = db
      .insert(merchants)
      .values({
        businessName: data.businessName,
        category: data.category,
        status: "draft",
      })
      .returning()
      .get();

    writeAuditLog({
      entityType: "merchant",
      entityId: merchant.id,
      action: "merchant.onboarding.started",
      actorId: session.userId,
      metadata: { businessName: data.businessName },
    });

    return { merchantId: merchant.id };
  }

  assertDraftMerchant(data.merchantId);

  if (data.step === 2) {
    db.update(merchants)
      .set({
        contactEmail: data.contactEmail,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, data.merchantId))
      .run();

    return { merchantId: data.merchantId };
  }

  if (data.step === 3) {
    db.transaction((tx) => {
      for (const document of data.documents) {
        tx.delete(merchantDocuments)
          .where(
            and(
              eq(merchantDocuments.merchantId, data.merchantId),
              eq(merchantDocuments.type, document.type)
            )
          )
          .run();

        tx.insert(merchantDocuments)
          .values({
            merchantId: data.merchantId,
            type: document.type,
            fileName: document.fileName,
          })
          .run();
      }
    });

    return { merchantId: data.merchantId };
  }

  const merchant = assertDraftMerchant(data.merchantId);
  const documents = db
    .select()
    .from(merchantDocuments)
    .where(eq(merchantDocuments.merchantId, data.merchantId))
    .all();

  const hasIdentity = documents.some((doc) => doc.type === "identity");
  const hasBankStatement = documents.some(
    (doc) => doc.type === "bank_statement"
  );

  if (!merchant.contactEmail) {
    throw new Error("Contact email is required before submission");
  }

  if (!hasIdentity || !hasBankStatement) {
    throw new Error("Identity and bank statement documents are required");
  }

  return {
    merchantId: data.merchantId,
    merchant,
    documents,
  };
}

export async function submitOnboardingImpl(data: SubmitOnboardingInput) {
  const session = requireReviewer(await readAppSession());
  const db = getDb();

  const merchant = assertDraftMerchant(data.merchantId);

  const documents = db
    .select()
    .from(merchantDocuments)
    .where(eq(merchantDocuments.merchantId, data.merchantId))
    .all();

  const hasIdentity = documents.some((doc) => doc.type === "identity");
  const hasBankStatement = documents.some(
    (doc) => doc.type === "bank_statement"
  );

  if (!merchant.contactEmail) {
    throw new Error("Contact email is required");
  }

  if (!hasIdentity || !hasBankStatement) {
    throw new Error("Required documents are missing");
  }

  db.transaction((tx) => {
    tx.update(merchants)
      .set({
        status: "pending",
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, data.merchantId))
      .run();

    tx.insert(auditLogs)
      .values({
        entityType: "merchant",
        entityId: data.merchantId,
        action: "merchant.submitted",
        actorId: session.userId,
        metadata: {
          previousStatus: "draft",
          nextStatus: "pending",
          documentCount: documents.length,
        },
      })
      .run();
  });

  return { success: true as const, merchantId: data.merchantId };
}

export async function getOnboardingDraftImpl(data: SubmitOnboardingInput) {
  requireReviewer(await readAppSession());
  const merchant = assertDraftMerchant(data.merchantId);

  const documents = getDb()
    .select()
    .from(merchantDocuments)
    .where(eq(merchantDocuments.merchantId, data.merchantId))
    .orderBy(desc(merchantDocuments.uploadedAt))
    .all();

  return { merchant, documents };
}
