import { describe, expect, it } from "vitest";
import { formatRate, initials } from "./format";

describe("formatRate", () => {
  it("formats a monthly number with thousands separator", () => {
    expect(formatRate(3600)).toBe("$3,600");
    expect(formatRate(0)).toBe("$0");
  });
  it("returns an em dash for null/undefined", () => {
    expect(formatRate(null)).toBe("—");
    expect(formatRate(undefined)).toBe("—");
  });
});

describe("initials", () => {
  it("takes up to two uppercase initials", () => {
    expect(initials("Ericka Dela Cruz")).toBe("ED");
    expect(initials("allen")).toBe("A");
  });
  it("collapses extra whitespace", () => {
    expect(initials("  Danica   Reyes ")).toBe("DR");
  });
});
