import { z } from "zod";

import { batchStatuses, merchantStatuses } from "#/db/schema";

export const loginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const merchantListSearchSchema = z.object({
  status: z.enum([...merchantStatuses, "all"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
});

export const merchantIdSchema = z.object({
  merchantId: z.uuid(),
});

export const merchantReviewSchema = z.object({
  merchantId: z.uuid(),
  note: z.string().min(1).max(500),
});

export const batchStatusSchema = z.enum(batchStatuses);

export const batchListSearchSchema = z.object({
  status: z.enum([...batchStatuses, "all"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
});

export const batchIdSchema = z.object({
  batchId: z.uuid(),
});

export const resolveDiscrepancySchema = z.object({
  batchId: z.uuid(),
  note: z.string().min(1).max(500),
});

export const auditListSearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

export const documentUploadSchema = z.object({
  type: z.enum(["identity", "bank_statement", "tax_form"]),
  fileName: z.string().min(1).max(255),
});

export const onboardingStepSchema = z.discriminatedUnion("step", [
  z.object({
    step: z.literal(1),
    merchantId: z.uuid().optional(),
    businessName: z.string().min(1).max(120),
    category: z.string().min(1).max(80),
  }),
  z.object({
    step: z.literal(2),
    merchantId: z.uuid(),
    contactEmail: z.email(),
  }),
  z.object({
    step: z.literal(3),
    merchantId: z.uuid(),
    documents: z.array(documentUploadSchema).min(1),
  }),
  z.object({
    step: z.literal(4),
    merchantId: z.uuid(),
  }),
]);

export const submitOnboardingSchema = z.object({
  merchantId: z.uuid(),
});
