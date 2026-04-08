import type { BrandDailyData, OverrideMap, AggregatedMetrics } from "@/lib/types";

/**
 * Apply cell overrides to brand data, recalculating totals.
 * Returns a new object — never mutates the input.
 */
export function applyOverrides(
  brands: Record<string, BrandDailyData>,
  overrides: OverrideMap
): Record<string, BrandDailyData> {
  if (Object.keys(overrides).length === 0) return brands;

  const result: Record<string, BrandDailyData> = {};

  for (const [brandKey, brand] of Object.entries(brands)) {
    // Check if any overrides exist for this brand
    const prefix = `${brandKey}:`;
    const hasOverrides = Object.keys(overrides).some((k) => k.startsWith(prefix));

    if (!hasOverrides) {
      result[brandKey] = brand;
      continue;
    }

    // Clone campaigns with overrides applied
    const campaigns: Record<string, AggregatedMetrics> = {};
    for (const [label, metrics] of Object.entries(brand.campaigns)) {
      const spendKey = `${brandKey}:${label}:spend`;
      const salesKey = `${brandKey}:${label}:sales`;
      const spend = spendKey in overrides ? overrides[spendKey] : metrics.spend;
      const sales = salesKey in overrides ? overrides[salesKey] : metrics.sales;
      const roas = spend > 0 ? Math.round((sales / spend) * 100) / 100 : 0;
      campaigns[label] = { spend, sales, roas };
    }

    // Recalculate ad totals from campaign rows
    let totalAdSpend = 0;
    let totalAdSales = 0;
    for (const metrics of Object.values(campaigns)) {
      totalAdSpend += metrics.spend;
      totalAdSales += metrics.sales;
    }

    // Total spend includes bloomifi + DSP (not overridable)
    const totalSpend = totalAdSpend + brand.bloomifi_spend + brand.dsp_spend;

    // ROAS = Ad Sales / Ad Spend
    const roas = totalAdSpend > 0 ? Math.round((totalAdSales / totalAdSpend) * 100) / 100 : 0;
    // TROAS = Total Sales / Total Spend
    const troas = totalSpend > 0 ? Math.round((brand.total_sales / totalSpend) * 100) / 100 : 0;
    // Spend vs Sales % = Total Spend / Total Sales
    const spendVsSales = brand.total_sales > 0 ? Math.round((totalSpend / brand.total_sales) * 10000) / 10000 : 0;

    result[brandKey] = {
      ...brand,
      campaigns,
      total_ad_spend: totalAdSpend,
      total_ad_sales: totalAdSales,
      roas,
      troas,
      spend_vs_sales: spendVsSales,
    };
  }

  return result;
}
