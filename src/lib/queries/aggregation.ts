import { format, startOfMonth } from "date-fns";
import { ROW_LABELS, BRANDS_CONFIG } from "@/lib/constants";
import { getExchangeRate } from "@/lib/currency";
import { getDailyCampaignData, getCampaignDataRange, getCampaignDataRangeGrouped } from "./campaigns";
import { getDailyTotalSales, getDailyTotalSalesRange } from "./sales";
import type { CampaignRow, AggregatedMetrics } from "@/lib/types";

/**
 * Group campaigns by pattern match and sum spend/sales.
 * Faithful translation of MarketingDataPuller.aggregate_by_pattern()
 *
 * Sorts patterns by match_priority so specific patterns (e.g., "vcpm")
 * match before broader ones (e.g., "$$") that may overlap in campaign names.
 * Tracks matched indices to prevent double-counting.
 */
export function aggregateByPattern(
  campaigns: CampaignRow[]
): Record<string, AggregatedMetrics> {
  const result: Record<string, AggregatedMetrics> = {};
  const matchedIndices = new Set<number>();

  // Sort by match_priority (lower = matched first)
  const matchOrder = [...ROW_LABELS].sort(
    (a, b) => (a.match_priority ?? 10) - (b.match_priority ?? 10)
  );

  for (const rowConfig of matchOrder) {
    const { label, pattern } = rowConfig;
    const patternLower = pattern.toLowerCase();

    let spend = 0;
    let sales = 0;

    for (let i = 0; i < campaigns.length; i++) {
      if (matchedIndices.has(i)) continue;

      const name = campaigns[i].campaign_name.toLowerCase();
      if (name.includes(patternLower)) {
        spend += campaigns[i].spend;
        sales += campaigns[i].sales;
        matchedIndices.add(i);
      }
    }

    const roas = spend > 0 ? Math.round((sales / spend) * 100) / 100 : 0;
    result[label] = { spend, sales, roas };
  }

  return result;
}

/**
 * Get aggregated daily data for a single brand with currency conversion.
 * Faithful translation of MarketingDataPuller.get_brand_daily_data()
 */
export async function getBrandDailyData(
  brandKey: string,
  targetDate: string
): Promise<Record<string, AggregatedMetrics>> {
  const config = BRANDS_CONFIG[brandKey];
  if (!config) {
    return Object.fromEntries(
      ROW_LABELS.map((r) => [r.label, { spend: 0, sales: 0, roas: 0 }])
    );
  }

  const campaigns = await getDailyCampaignData(config.schema, targetDate);

  if (campaigns.length === 0) {
    return Object.fromEntries(
      ROW_LABELS.map((r) => [r.label, { spend: 0, sales: 0, roas: 0 }])
    );
  }

  const result = aggregateByPattern(campaigns);

  // Convert to USD if brand uses non-USD currency
  const currency = config.currency ?? "USD";
  if (currency !== "USD") {
    const rate = await getExchangeRate(currency);
    for (const data of Object.values(result)) {
      data.spend = Math.round(data.spend * rate * 100) / 100;
      data.sales = Math.round(data.sales * rate * 100) / 100;
      // ROAS is a ratio, stays the same
    }
  }

  return result;
}

/**
 * Get aggregated daily data for a single brand across an entire date range,
 * returned as a map of date -> Record<label, AggregatedMetrics>.
 * Single DB query instead of per-day queries.
 */
export async function getBrandDailyDataRange(
  brandKey: string,
  startDate: string,
  endDate: string
): Promise<Record<string, Record<string, AggregatedMetrics>>> {
  const config = BRANDS_CONFIG[brandKey];
  const emptyDay = Object.fromEntries(
    ROW_LABELS.map((r) => [r.label, { spend: 0, sales: 0, roas: 0 }])
  );

  if (!config) return {};

  const groupedCampaigns = await getCampaignDataRangeGrouped(
    config.schema,
    startDate,
    endDate
  );

  // Currency conversion rate (fetched once, not per-day)
  const currency = config.currency ?? "USD";
  let rate = 1.0;
  if (currency !== "USD") {
    rate = await getExchangeRate(currency);
  }

  const result: Record<string, Record<string, AggregatedMetrics>> = {};

  for (const [dateStr, campaigns] of Object.entries(groupedCampaigns)) {
    if (campaigns.length === 0) {
      result[dateStr] = { ...emptyDay };
      continue;
    }

    const aggregated = aggregateByPattern(campaigns);

    if (rate !== 1.0) {
      for (const data of Object.values(aggregated)) {
        data.spend = Math.round(data.spend * rate * 100) / 100;
        data.sales = Math.round(data.sales * rate * 100) / 100;
      }
    }

    result[dateStr] = aggregated;
  }

  return result;
}

/**
 * Get total sales for a brand across a date range, grouped by date.
 * Single DB query instead of per-day queries.
 */
export async function getBrandTotalSalesRange(
  brandKey: string,
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  const config = BRANDS_CONFIG[brandKey];
  if (!config) return {};

  const salesByDate = await getDailyTotalSalesRange(
    config.schema,
    startDate,
    endDate,
    config.sales_channel
  );

  const currency = config.currency ?? "USD";
  if (currency !== "USD") {
    const rate = await getExchangeRate(currency);
    for (const dateStr of Object.keys(salesByDate)) {
      salesByDate[dateStr] = Math.round(salesByDate[dateStr] * rate * 100) / 100;
    }
  }

  return salesByDate;
}

/**
 * Get total sales for a brand with currency conversion.
 */
export async function getBrandTotalSales(
  brandKey: string,
  targetDate: string
): Promise<number> {
  const config = BRANDS_CONFIG[brandKey];
  if (!config) return 0;

  let totalSales = await getDailyTotalSales(
    config.schema,
    targetDate,
    config.sales_channel
  );

  const currency = config.currency ?? "USD";
  if (currency !== "USD") {
    const rate = await getExchangeRate(currency);
    totalSales = Math.round(totalSales * rate * 100) / 100;
  }

  return totalSales;
}

/**
 * Get month-to-date aggregated campaign data for a brand.
 * Spans from 1st of the month through targetDate.
 */
export async function getBrandMTDData(
  brandKey: string,
  targetDate: string
): Promise<Record<string, AggregatedMetrics>> {
  const config = BRANDS_CONFIG[brandKey];
  if (!config) {
    return Object.fromEntries(
      ROW_LABELS.map((r) => [r.label, { spend: 0, sales: 0, roas: 0 }])
    );
  }

  const monthStart = format(startOfMonth(new Date(targetDate + "T00:00:00")), "yyyy-MM-dd");
  const campaigns = await getCampaignDataRange(config.schema, monthStart, targetDate);

  if (campaigns.length === 0) {
    return Object.fromEntries(
      ROW_LABELS.map((r) => [r.label, { spend: 0, sales: 0, roas: 0 }])
    );
  }

  const result = aggregateByPattern(campaigns);

  const currency = config.currency ?? "USD";
  if (currency !== "USD") {
    const rate = await getExchangeRate(currency);
    for (const data of Object.values(result)) {
      data.spend = Math.round(data.spend * rate * 100) / 100;
      data.sales = Math.round(data.sales * rate * 100) / 100;
    }
  }

  return result;
}
