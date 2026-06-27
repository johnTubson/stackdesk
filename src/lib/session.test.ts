import { describe, expect, it } from "vitest";

import { requireAdmin, requireAuth, requireReviewer } from "#/lib/session";

const adminUser = {
  userId: "1",
  email: "admin@stackdesk.demo",
  name: "Admin",
  role: "admin" as const,
};

const reviewerUser = {
  userId: "2",
  email: "reviewer@stackdesk.demo",
  name: "Reviewer",
  role: "reviewer" as const,
};

describe("requireAuth", () => {
  it("returns session when present", () => {
    expect(requireAuth(adminUser)).toEqual(adminUser);
  });

  it("throws when session is null", () => {
    expect(() => requireAuth(null)).toThrow("Unauthorized");
  });
});

describe("requireReviewer", () => {
  it("allows admin", () => {
    expect(requireReviewer(adminUser)).toEqual(adminUser);
  });

  it("allows reviewer", () => {
    expect(requireReviewer(reviewerUser)).toEqual(reviewerUser);
  });

  it("throws when unauthenticated", () => {
    expect(() => requireReviewer(null)).toThrow("Unauthorized");
  });
});

describe("requireAdmin", () => {
  it("allows admin", () => {
    expect(requireAdmin(adminUser)).toEqual(adminUser);
  });

  it("rejects reviewer", () => {
    expect(() => requireReviewer(reviewerUser)).not.toThrow();
    expect(() => requireAdmin(reviewerUser)).toThrow(
      "Forbidden: admin role required"
    );
  });

  it("throws when unauthenticated", () => {
    expect(() => requireAdmin(null)).toThrow("Unauthorized");
  });
});
