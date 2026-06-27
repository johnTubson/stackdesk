import { describe, expect, it } from "vitest";

import {
  auditListSearchSchema,
  batchIdSchema,
  batchListSearchSchema,
  loginInputSchema,
  merchantListSearchSchema,
  merchantReviewSchema,
  onboardingStepSchema,
  resolveDiscrepancySchema,
  submitOnboardingSchema,
} from "#/lib/validators";

describe("loginInputSchema", () => {
  it("accepts valid credentials input", () => {
    const result = loginInputSchema.parse({
      email: "admin@stackdesk.demo",
      password: "demo1234",
    });

    expect(result.email).toBe("admin@stackdesk.demo");
  });

  it("rejects invalid email", () => {
    expect(() =>
      loginInputSchema.parse({ email: "not-an-email", password: "x" })
    ).toThrow();
  });
});

describe("merchantListSearchSchema", () => {
  it("defaults status and page", () => {
    expect(merchantListSearchSchema.parse({})).toEqual({
      status: "all",
      page: 1,
    });
  });

  it("coerces page from string", () => {
    expect(merchantListSearchSchema.parse({ page: "2" }).page).toBe(2);
  });

  it("rejects invalid status", () => {
    expect(() =>
      merchantListSearchSchema.parse({ status: "invalid" })
    ).toThrow();
  });
});

describe("merchantReviewSchema", () => {
  it("requires a note", () => {
    expect(() =>
      merchantReviewSchema.parse({
        merchantId: "00000000-0000-4000-8000-000000000001",
        note: "",
      })
    ).toThrow();
  });
});

describe("batchListSearchSchema", () => {
  it("accepts discrepancy filter", () => {
    expect(
      batchListSearchSchema.parse({ status: "discrepancy", page: 1 })
    ).toEqual({
      status: "discrepancy",
      page: 1,
    });
  });
});

describe("batchIdSchema", () => {
  it("requires a uuid batch id", () => {
    expect(() => batchIdSchema.parse({ batchId: "bad-id" })).toThrow();
  });
});

describe("resolveDiscrepancySchema", () => {
  it("requires resolution note", () => {
    expect(() =>
      resolveDiscrepancySchema.parse({
        batchId: "00000000-0000-4000-8000-000000000001",
        note: "",
      })
    ).toThrow();
  });
});

describe("auditListSearchSchema", () => {
  it("defaults page to 1", () => {
    expect(auditListSearchSchema.parse({})).toEqual({ page: 1 });
  });
});

describe("onboardingStepSchema", () => {
  it("validates step 1 business fields", () => {
    const result = onboardingStepSchema.parse({
      step: 1,
      businessName: "Acme LLC",
      category: "Retail",
    });

    expect(result.step).toBe(1);
  });

  it("validates step 3 documents", () => {
    const result = onboardingStepSchema.parse({
      step: 3,
      merchantId: "00000000-0000-4000-8000-000000000001",
      documents: [{ type: "identity", fileName: "id.pdf" }],
    });

    expect(result.step).toBe(3);
    if (result.step === 3) {
      expect(result.documents).toHaveLength(1);
    }
  });
});

describe("submitOnboardingSchema", () => {
  it("requires merchant id uuid", () => {
    expect(() =>
      submitOnboardingSchema.parse({ merchantId: "not-uuid" })
    ).toThrow();
  });
});
