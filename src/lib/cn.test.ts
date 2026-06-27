import { describe, expect, it } from "vitest";

import { cn } from "#/lib/cn";

describe("cn", () => {
  it("joins class names and drops falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});
