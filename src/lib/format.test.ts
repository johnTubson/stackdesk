import { describe, expect, it } from "vitest";

import { formatMoney } from "#/lib/format";

describe("formatMoney", () => {
  it("formats cents as USD without decimals", () => {
    expect(formatMoney(125_000)).toBe("$1,250");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("$0");
  });

  it("formats small amounts", () => {
    expect(formatMoney(99)).toBe("$1");
  });
});
