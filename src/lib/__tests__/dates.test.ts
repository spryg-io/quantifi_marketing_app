import { describe, it, expect } from "vitest";
import { getDefaultBrandDateRange, getDefaultMonth, normalizeRange } from "../dates";

describe("getDefaultBrandDateRange", () => {
  it("mid-month: returns 1st of current month through yesterday", () => {
    const apr15 = new Date(2026, 3, 15); // April 15
    const result = getDefaultBrandDateRange(apr15);
    expect(result).toEqual({ from: "2026-04-01", to: "2026-04-14" });
  });

  it("1st of month: falls back to full previous month", () => {
    const apr1 = new Date(2026, 3, 1); // April 1
    const result = getDefaultBrandDateRange(apr1);
    expect(result).toEqual({ from: "2026-03-01", to: "2026-03-31" });
  });

  it("2nd of month: shows MTD with 1 day", () => {
    const apr2 = new Date(2026, 3, 2); // April 2
    const result = getDefaultBrandDateRange(apr2);
    expect(result).toEqual({ from: "2026-04-01", to: "2026-04-01" });
  });

  it("Jan 1: falls back to full December of previous year", () => {
    const jan1 = new Date(2026, 0, 1); // Jan 1
    const result = getDefaultBrandDateRange(jan1);
    expect(result).toEqual({ from: "2025-12-01", to: "2025-12-31" });
  });

  it("last day of month: shows full MTD", () => {
    const mar31 = new Date(2026, 2, 31); // March 31
    const result = getDefaultBrandDateRange(mar31);
    expect(result).toEqual({ from: "2026-03-01", to: "2026-03-30" });
  });

  it("from is always <= to", () => {
    // Test every day of a month to verify no inversions
    for (let day = 1; day <= 28; day++) {
      const date = new Date(2026, 3, day); // April 1-28
      const result = getDefaultBrandDateRange(date);
      expect(result.from <= result.to).toBe(true);
    }
  });
});

describe("getDefaultMonth", () => {
  it("mid-month: returns current month", () => {
    const apr15 = new Date(2026, 3, 15);
    const result = getDefaultMonth(apr15);
    expect(result.getMonth()).toBe(3); // April
    expect(result.getFullYear()).toBe(2026);
  });

  it("1st of month: returns previous month", () => {
    const apr1 = new Date(2026, 3, 1);
    const result = getDefaultMonth(apr1);
    expect(result.getMonth()).toBe(2); // March
    expect(result.getFullYear()).toBe(2026);
  });

  it("2nd of month: returns current month", () => {
    const apr2 = new Date(2026, 3, 2);
    const result = getDefaultMonth(apr2);
    expect(result.getMonth()).toBe(3); // April
  });

  it("Jan 1: returns December of previous year", () => {
    const jan1 = new Date(2026, 0, 1);
    const result = getDefaultMonth(jan1);
    expect(result.getMonth()).toBe(11); // December
    expect(result.getFullYear()).toBe(2025);
  });

  it("last day of month: returns current month", () => {
    const mar31 = new Date(2026, 2, 31);
    const result = getDefaultMonth(mar31);
    expect(result.getMonth()).toBe(2); // March
  });
});

describe("normalizeRange", () => {
  it("valid range: returns as-is", () => {
    expect(normalizeRange("2026-03-01", "2026-03-31")).toEqual({
      from: "2026-03-01",
      to: "2026-03-31",
    });
  });

  it("inverted range: swaps from and to", () => {
    expect(normalizeRange("2026-04-01", "2026-03-31")).toEqual({
      from: "2026-03-31",
      to: "2026-04-01",
    });
  });

  it("same date: returns as-is", () => {
    expect(normalizeRange("2026-04-01", "2026-04-01")).toEqual({
      from: "2026-04-01",
      to: "2026-04-01",
    });
  });

  it("cross-year inverted range: swaps correctly", () => {
    expect(normalizeRange("2026-01-01", "2025-12-31")).toEqual({
      from: "2025-12-31",
      to: "2026-01-01",
    });
  });
});
