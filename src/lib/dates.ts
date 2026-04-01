import { format, startOfMonth, subDays, subMonths } from "date-fns";

/**
 * Get the default date range for the brand detail page.
 * Shows month-to-date through yesterday. On the 1st of a month,
 * yesterday falls in the previous month, so we show the full previous month.
 */
export function getDefaultBrandDateRange(now: Date = new Date()): {
  from: string;
  to: string;
} {
  const yesterday = subDays(now, 1);
  return {
    from: format(startOfMonth(yesterday), "yyyy-MM-dd"),
    to: format(yesterday, "yyyy-MM-dd"),
  };
}

/**
 * Get the default month for the monthly summary page.
 * On the 1st of a month there's no data yet, so show previous month.
 */
export function getDefaultMonth(now: Date = new Date()): Date {
  return now.getDate() === 1 ? subMonths(now, 1) : now;
}

/**
 * Ensure a date range is valid (from <= to). If inverted, swap them.
 */
export function normalizeRange(from: string, to: string): { from: string; to: string } {
  if (from > to) {
    return { from: to, to: from };
  }
  return { from, to };
}
