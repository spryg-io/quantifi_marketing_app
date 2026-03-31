# Data Loading Performance Optimization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce page load times by consolidating per-day DB queries into range queries and adding an in-memory response cache with manual refresh support.

**Architecture:** New `cache.ts` utility wraps API route data-fetching in a TTL cache keyed by endpoint+params. New grouped query functions replace per-day loops in the brand detail API. Sales queries rewritten for index-friendly WHERE clauses. UI pages get a refresh button that bypasses cache.

**Tech Stack:** Next.js 14 (App Router), PostgreSQL (pg pool), TypeScript, React, Lucide icons (already in project)

**Note:** This project has no test framework configured. Steps focus on implementation with manual verification via `npm run build` and runtime testing.

---

## File Structure

| Action | File | Responsibility |
|-|-|-|
| Create | `src/lib/cache.ts` | In-memory TTL cache utility with bypass support |
| Modify | `src/lib/queries/campaigns.ts` | Add `getCampaignDataRangeGrouped()` for date-grouped campaign data |
| Modify | `src/lib/queries/sales.ts` | Add `getDailyTotalSalesRange()`, fix timezone WHERE clauses |
| Modify | `src/lib/queries/aggregation.ts` | Add `getBrandDailyDataRange()` and `getBrandTotalSalesRange()` |
| Modify | `src/app/api/brand/[slug]/route.ts` | Use range queries + cache |
| Modify | `src/app/api/daily/route.ts` | Wrap in cache |
| Modify | `src/app/api/monthly/route.ts` | Wrap in cache |
| Modify | `src/app/daily/page.tsx` | Add refresh button |
| Modify | `src/app/monthly/page.tsx` | Add refresh button |
| Modify | `src/app/brand/[slug]/page.tsx` | Add refresh button |

---

### Task 1: Create In-Memory Cache Utility

**Files:**
- Create: `src/lib/cache.ts`

- [ ] **Step 1: Create `src/lib/cache.ts`**

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Get cached data or fetch fresh. Skips cache read (but still writes) when
 * bypass is true. Never caches if the key contains today's date.
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number; bypass?: boolean }
): Promise<T> {
  const ttl = options?.ttl ?? DEFAULT_TTL;
  const bypass = options?.bypass ?? false;

  // Never cache today's date — check if key contains today's YYYY-MM-DD
  const today = new Date().toISOString().slice(0, 10);
  const isToday = key.includes(today);

  if (!bypass && !isToday) {
    const cached = store.get(key) as CacheEntry<T> | undefined;
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
  }

  const data = await fetcher();

  if (!isToday) {
    store.set(key, { data, timestamp: Date.now() });
  }

  return data;
}

/** Clear all cached entries. Useful for testing. */
export function clearCache(): void {
  store.clear();
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Compiles without errors (file is not yet imported anywhere).

- [ ] **Step 3: Commit**

```bash
git add src/lib/cache.ts
git commit -m "feat: add in-memory TTL cache utility"
```

---

### Task 2: Add Grouped Campaign Range Query

**Files:**
- Modify: `src/lib/queries/campaigns.ts`

- [ ] **Step 1: Add `getCampaignDataRangeGrouped()` to `campaigns.ts`**

Add this function after the existing `getCampaignDataRange` function (after line 104):

```typescript
/**
 * Query SP, SB, SD campaign tables for a date range, grouped by date.
 * Returns a map of date string -> CampaignRow[].
 * Used by brand detail page to avoid per-day queries.
 */
export async function getCampaignDataRangeGrouped(
  schema: string,
  startDate: string,
  endDate: string
): Promise<Record<string, CampaignRow[]>> {
  const query = `
    SELECT date::text as date, campaign_name,
           COALESCE(spend, 0) as spend,
           COALESCE(sales_14d, 0) as sales,
           'SP' as ad_type
    FROM ${schema}.advertising_spcampaignreport
    WHERE date >= $1 AND date <= $2
    UNION ALL
    SELECT date::text as date, campaign_name,
           COALESCE(cost, 0) as spend,
           COALESCE(attributed_sales_14d, 0) as sales,
           'SB' as ad_type
    FROM ${schema}.advertising_sbcampaignreport
    WHERE date >= $1 AND date <= $2
    UNION ALL
    SELECT date::text as date, campaign_name,
           COALESCE(spend, 0) as spend,
           COALESCE(sales, 0) as sales,
           'SD' as ad_type
    FROM ${schema}.advertising_sdcampaignreport
    WHERE date >= $1 AND date <= $2
  `;

  try {
    const result = await pool.query(query, [startDate, endDate]);
    const grouped: Record<string, CampaignRow[]> = {};

    for (const row of result.rows) {
      const dateKey = row.date;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push({
        campaign_name: row.campaign_name,
        spend: parseFloat(row.spend),
        sales: parseFloat(row.sales),
        ad_type: row.ad_type,
      });
    }

    return grouped;
  } catch (error) {
    console.error(`Campaign range grouped error for ${schema}:`, error);
    return {};
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Compiles without errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/campaigns.ts
git commit -m "feat: add grouped campaign range query for brand detail"
```

---

### Task 3: Add Range Sales Query + Fix Timezone Index Issue

**Files:**
- Modify: `src/lib/queries/sales.ts`

- [ ] **Step 1: Add `getDailyTotalSalesRange()` to `sales.ts`**

Add this function after the existing `getMonthlySales` function (after line 61):

```typescript
/**
 * Get total sales for a brand grouped by date over a date range.
 * Returns a map of date string (YYYY-MM-DD) -> total sales number.
 * Uses index-friendly range comparison instead of DATE() wrapping.
 */
export async function getDailyTotalSalesRange(
  schema: string,
  startDate: string,
  endDate: string,
  salesChannel?: string
): Promise<Record<string, number>> {
  const channelFilter = salesChannel ? "AND sales_channel = $3" : "";
  const query = `
    SELECT
      DATE(purchase_date AT TIME ZONE 'America/Los_Angeles')::text as date,
      COALESCE(SUM(item_price), 0) as total_sales
    FROM ${schema}.sales_order
    WHERE purchase_date >= ($1::date)::timestamp AT TIME ZONE 'America/Los_Angeles'
      AND purchase_date < (($2::date) + 1)::timestamp AT TIME ZONE 'America/Los_Angeles'
      ${channelFilter}
    GROUP BY DATE(purchase_date AT TIME ZONE 'America/Los_Angeles')
  `;

  try {
    const params: string[] = [startDate, endDate];
    if (salesChannel) params.push(salesChannel);
    const result = await pool.query(query, params);

    const grouped: Record<string, number> = {};
    for (const row of result.rows) {
      grouped[row.date] = parseFloat(row.total_sales);
    }
    return grouped;
  } catch (error) {
    console.warn(`Could not fetch total sales range for ${schema}:`, error);
    return {};
  }
}
```

- [ ] **Step 2: Fix `getDailyTotalSales` WHERE clause for index usage**

Replace the existing `getDailyTotalSales` function (lines 7-30) with:

```typescript
/**
 * Get total sales for a brand on a given date from sales_order table.
 * Uses index-friendly range comparison on purchase_date.
 */
export async function getDailyTotalSales(
  schema: string,
  targetDate: string,
  salesChannel?: string
): Promise<number> {
  const channelFilter = salesChannel ? "AND sales_channel = $2" : "";
  const query = `
    SELECT COALESCE(SUM(item_price), 0) as total_sales
    FROM ${schema}.sales_order
    WHERE purchase_date >= ($1::date)::timestamp AT TIME ZONE 'America/Los_Angeles'
      AND purchase_date < (($1::date) + 1)::timestamp AT TIME ZONE 'America/Los_Angeles'
    ${channelFilter}
  `;

  try {
    const params: string[] = [targetDate];
    if (salesChannel) params.push(salesChannel);
    const result = await pool.query(query, params);
    const row = result.rows[0];
    return row ? parseFloat(row.total_sales) : 0;
  } catch (error) {
    console.warn(`Could not fetch total sales for ${schema}:`, error);
    return 0;
  }
}
```

- [ ] **Step 3: Fix `getMonthlySales` WHERE clause for index usage**

Replace the existing `getMonthlySales` function (lines 36-61) with:

```typescript
/**
 * Get monthly total sales from sales_order table.
 * Uses index-friendly range comparison on purchase_date.
 */
export async function getMonthlySales(
  schema: string,
  startDate: string,
  endDate: string,
  salesChannel?: string
): Promise<number> {
  const channelFilter = salesChannel ? "AND sales_channel = $3" : "";
  const query = `
    SELECT COALESCE(SUM(item_price), 0) as total_sales
    FROM ${schema}.sales_order
    WHERE purchase_date >= ($1::date)::timestamp AT TIME ZONE 'America/Los_Angeles'
      AND purchase_date < (($2::date) + 1)::timestamp AT TIME ZONE 'America/Los_Angeles'
    ${channelFilter}
  `;

  try {
    const params: string[] = [startDate, endDate];
    if (salesChannel) params.push(salesChannel);
    const result = await pool.query(query, params);
    const row = result.rows[0];
    return row ? parseFloat(row.total_sales) : 0;
  } catch (error) {
    console.warn(`Monthly sales error for ${schema}:`, error);
    return 0;
  }
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Compiles without errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/sales.ts
git commit -m "feat: add range sales query, fix timezone WHERE for index usage"
```

---

### Task 4: Add Range Aggregation Functions

**Files:**
- Modify: `src/lib/queries/aggregation.ts`

- [ ] **Step 1: Add imports for the new grouped query functions**

At the top of `aggregation.ts`, update the imports from `"./campaigns"` (line 4) to also include the new function:

Replace:
```typescript
import { getDailyCampaignData, getCampaignDataRange } from "./campaigns";
```
With:
```typescript
import { getDailyCampaignData, getCampaignDataRange, getCampaignDataRangeGrouped } from "./campaigns";
```

Update the import from `"./sales"` (line 5) to also include the new function:

Replace:
```typescript
import { getDailyTotalSales } from "./sales";
```
With:
```typescript
import { getDailyTotalSales, getDailyTotalSalesRange } from "./sales";
```

- [ ] **Step 2: Add `getBrandDailyDataRange()` function**

Add after the existing `getBrandDailyData` function (after line 89):

```typescript
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
```

- [ ] **Step 3: Add `getBrandTotalSalesRange()` function**

Add after the new `getBrandDailyDataRange` function:

```typescript
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
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Compiles without errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/aggregation.ts
git commit -m "feat: add range aggregation functions for brand detail"
```

---

### Task 5: Rewrite Brand Detail API to Use Range Queries + Cache

**Files:**
- Modify: `src/app/api/brand/[slug]/route.ts`

- [ ] **Step 1: Replace the entire brand route with the consolidated version**

Replace the full contents of `src/app/api/brand/[slug]/route.ts` with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { format, startOfMonth, eachDayOfInterval, parse } from "date-fns";
import { BRANDS_CONFIG, ROW_LABELS } from "@/lib/constants";
import { getBrandDailyDataRange, getBrandTotalSalesRange } from "@/lib/queries/aggregation";
import { getCached } from "@/lib/cache";
import type { BrandDetailResponse, BrandTimeSeriesPoint, BrandCampaignBreakdown } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const searchParams = request.nextUrl.searchParams;
  const refresh = searchParams.get("refresh") === "true";

  const config = BRANDS_CONFIG[slug];
  if (!config) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const now = new Date();
  const fromStr = searchParams.get("from") || format(startOfMonth(now), "yyyy-MM-dd");
  const toStr = searchParams.get("to") || format(now, "yyyy-MM-dd");

  try {
    const cacheKey = `brand:${slug}:${fromStr}:${toStr}`;

    const response = await getCached<BrandDetailResponse>(
      cacheKey,
      async () => {
        const fromDate = parse(fromStr, "yyyy-MM-dd", new Date());
        const toDate = parse(toStr, "yyyy-MM-dd", new Date());
        const days = eachDayOfInterval({ start: fromDate, end: toDate });

        // Two queries instead of 2 * days.length
        const [campaignsByDate, salesByDate] = await Promise.all([
          getBrandDailyDataRange(slug, fromStr, toStr),
          getBrandTotalSalesRange(slug, fromStr, toStr),
        ]);

        // Build time series
        const timeSeries: BrandTimeSeriesPoint[] = [];
        const breakdownAccum: Record<string, { spend: number; sales: number }> = {};

        let totalSpend = 0;
        let totalAdSales = 0;
        let totalTotalSales = 0;

        for (const day of days) {
          const dateStr = format(day, "yyyy-MM-dd");
          const campaigns = campaignsByDate[dateStr] || {};
          const totalSales = salesByDate[dateStr] || 0;

          let daySpend = 0;
          let daySales = 0;

          for (const label of ROW_LABELS.map((r) => r.label)) {
            const data = campaigns[label];
            if (data) {
              daySpend += data.spend;
              daySales += data.sales;

              if (!breakdownAccum[label]) {
                breakdownAccum[label] = { spend: 0, sales: 0 };
              }
              breakdownAccum[label].spend += data.spend;
              breakdownAccum[label].sales += data.sales;
            }
          }

          const roas = daySpend > 0 ? Math.round((daySales / daySpend) * 100) / 100 : 0;
          const troas = daySpend > 0 ? Math.round((totalSales / daySpend) * 100) / 100 : 0;

          timeSeries.push({
            date: dateStr,
            spend: Math.round(daySpend * 100) / 100,
            sales: Math.round(daySales * 100) / 100,
            roas,
            total_sales: Math.round(totalSales * 100) / 100,
            troas,
          });

          totalSpend += daySpend;
          totalAdSales += daySales;
          totalTotalSales += totalSales;
        }

        const campaignBreakdown: BrandCampaignBreakdown[] = ROW_LABELS.map((r) => ({
          label: r.label,
          spend: Math.round((breakdownAccum[r.label]?.spend || 0) * 100) / 100,
          sales: Math.round((breakdownAccum[r.label]?.sales || 0) * 100) / 100,
        })).filter((b) => b.spend > 0 || b.sales > 0);

        return {
          brand_key: slug,
          display_name: config.display_name,
          from: fromStr,
          to: toStr,
          time_series: timeSeries,
          campaign_breakdown: campaignBreakdown,
          totals: {
            spend: Math.round(totalSpend * 100) / 100,
            sales: Math.round(totalAdSales * 100) / 100,
            roas: totalSpend > 0 ? Math.round((totalAdSales / totalSpend) * 100) / 100 : 0,
            total_sales: Math.round(totalTotalSales * 100) / 100,
            troas: totalSpend > 0 ? Math.round((totalTotalSales / totalSpend) * 100) / 100 : 0,
          },
        };
      },
      { bypass: refresh }
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Brand API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand data" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Compiles without errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/brand/[slug]/route.ts
git commit -m "feat: brand API uses range queries + cache (124 queries -> 2)"
```

---

### Task 6: Add Cache to Daily API

**Files:**
- Modify: `src/app/api/daily/route.ts`

- [ ] **Step 1: Add cache import and wrap response**

At the top of `src/app/api/daily/route.ts`, add the cache import after the existing imports (after line 8):

```typescript
import { getCached } from "@/lib/cache";
```

- [ ] **Step 2: Read the `refresh` param and wrap the data-fetching in `getCached`**

Replace the body of the `GET` function (lines 10-102) with:

```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateStr = searchParams.get("date") || format(subDays(new Date(), 1), "yyyy-MM-dd");
  const refresh = searchParams.get("refresh") === "true";

  try {
    const cacheKey = `daily:${dateStr}`;

    const response = await getCached<DailyResponse>(
      cacheKey,
      async () => {
        // Fetch all brand data + bloomifi in parallel
        const [bloomifiSpend, ...brandResults] = await Promise.all([
          getBloomifiDailySpend(dateStr),
          ...ALL_BRANDS.map(async (brandKey) => {
            const config = BRANDS_CONFIG[brandKey];
            const [campaigns, totalSales, dspData, mtdCampaigns] = await Promise.all([
              getBrandDailyData(brandKey, dateStr),
              getBrandTotalSales(brandKey, dateStr),
              getDailyDspData(config.schema, dateStr),
              getBrandMTDData(brandKey, dateStr),
            ]);

            // Currency conversion for DSP
            let dspSpend = dspData.spend;
            let dspSales = dspData.sales;
            const currency = config.currency ?? "USD";
            if (currency !== "USD") {
              const rate = await getExchangeRate(currency);
              dspSpend = Math.round(dspSpend * rate * 100) / 100;
              dspSales = Math.round(dspSales * rate * 100) / 100;
            }

            return { brandKey, campaigns, totalSales, dspSpend, dspSales, mtdCampaigns };
          }),
        ]);

        // Build per-brand response
        const brands: Record<string, BrandDailyData> = {};

        for (const { brandKey, campaigns, totalSales, dspSpend, dspSales, mtdCampaigns } of brandResults) {
          const config = BRANDS_CONFIG[brandKey];

          // Get bloomifi spend for this brand's schema
          const bloomifiSpendValue = bloomifiSpend[config.schema] || 0;

          // Calculate totals from campaign rows
          let totalAdSpend = 0;
          let totalAdSales = 0;
          for (const label of ROW_LABELS.map((r) => r.label)) {
            const data = campaigns[label];
            if (data) {
              totalAdSpend += data.spend || 0;
              totalAdSales += data.sales || 0;
            }
          }

          // Add bloomifi + DSP to total spend
          const totalSpend = totalAdSpend + bloomifiSpendValue + dspSpend;

          // ROAS = Ad Sales / Ad Spend (campaign rows only)
          const roas = totalAdSpend > 0 ? Math.round((totalAdSales / totalAdSpend) * 100) / 100 : 0;
          // TROAS = Total Sales / Total Spend (includes bloomifi + DSP)
          const troas = totalSpend > 0 ? Math.round((totalSales / totalSpend) * 100) / 100 : 0;
          // Spend vs Sales % = Total Spend / Total Sales
          const spendVsSales = totalSales > 0 ? Math.round((totalSpend / totalSales) * 10000) / 10000 : 0;

          brands[brandKey] = {
            campaigns,
            mtd_campaigns: mtdCampaigns,
            total_sales: totalSales,
            bloomifi_spend: bloomifiSpendValue,
            dsp_spend: dspSpend,
            dsp_sales: dspSales,
            total_ad_spend: totalAdSpend,
            total_ad_sales: totalAdSales,
            roas,
            troas,
            spend_vs_sales: spendVsSales,
          };
        }

        return {
          date: dateStr,
          brands,
          brand_order: BRAND_ORDER,
          sbl_brand_order: SBL_BRAND_ORDER,
          row_labels: ROW_LABELS.map((r) => r.label),
        };
      },
      { bypass: refresh }
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Daily API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily data" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Compiles without errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/daily/route.ts
git commit -m "feat: wrap daily API in response cache"
```

---

### Task 7: Add Cache to Monthly API

**Files:**
- Modify: `src/app/api/monthly/route.ts`

- [ ] **Step 1: Add cache import**

At the top of `src/app/api/monthly/route.ts`, add after the existing imports (after line 13):

```typescript
import { getCached } from "@/lib/cache";
```

- [ ] **Step 2: Read `refresh` param and wrap the data-fetching in `getCached`**

Replace the body of the `GET` function (lines 15-186) with:

```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const monthStr = searchParams.get("month") || format(new Date(), "yyyy-MM");
  const refresh = searchParams.get("refresh") === "true";

  try {
    const cacheKey = `monthly:${monthStr}`;

    const response = await getCached<MonthlyResponse>(
      cacheKey,
      async () => {
        const monthDate = parse(monthStr, "yyyy-MM", new Date());
        const startDate = format(startOfMonth(monthDate), "yyyy-MM-dd");
        const endDate = format(endOfMonth(monthDate), "yyyy-MM-dd");

        // Gather unique brand keys needed
        const brandKeysNeeded = new Set<string>();
        for (const entry of MASTER_TAB_BRANDS) {
          if (entry.source === "database" && entry.brand_key) {
            brandKeysNeeded.add(entry.brand_key);
          } else if (entry.source === "database_sum" && entry.brand_keys) {
            for (const k of entry.brand_keys) brandKeysNeeded.add(k);
          }
        }

        // Fetch all data in parallel
        const [bloomifiSpend, ...brandResults] = await Promise.all([
          getBloomifiMonthlySpend(startDate, endDate),
          ...Array.from(brandKeysNeeded).map(async (brandKey) => {
            const config = BRANDS_CONFIG[brandKey];
            if (!config) return { brandKey, spend: 0, sales: 0, dspSpend: 0, dspSales: 0 };

            const [spend, sales, dsp] = await Promise.all([
              getMonthlyAdSpend(config.schema, startDate, endDate),
              getMonthlySales(config.schema, startDate, endDate, config.sales_channel),
              getMonthlyDspSpend(config.schema, startDate, endDate),
            ]);

            // Currency conversion
            const currency = config.currency ?? "USD";
            let convertedSpend = spend;
            let convertedSales = sales;
            let convertedDspSpend = dsp.spend;
            let convertedDspSales = dsp.sales;
            if (currency !== "USD") {
              const rate = await getExchangeRate(currency);
              convertedSpend = Math.round(spend * rate * 100) / 100;
              convertedSales = Math.round(sales * rate * 100) / 100;
              convertedDspSpend = Math.round(dsp.spend * rate * 100) / 100;
              convertedDspSales = Math.round(dsp.sales * rate * 100) / 100;
            }

            return {
              brandKey,
              spend: convertedSpend,
              sales: convertedSales,
              dspSpend: convertedDspSpend,
              dspSales: convertedDspSales,
            };
          }),
        ]);

        // Build DB totals lookup
        const dbTotals: Record<string, { spend: number; sales: number }> = {};
        const dspTotals: Record<string, { spend: number; sales: number }> = {};
        for (const r of brandResults) {
          dbTotals[r.brandKey] = { spend: r.spend, sales: r.sales };
          dspTotals[r.brandKey] = { spend: r.dspSpend, sales: r.dspSales };
        }

        // Build bloomifi spend by brand_key
        const bloomifiByBrand: Record<string, number> = {};
        for (const brandKey of ALL_BRANDS) {
          const config = BRANDS_CONFIG[brandKey];
          if (config && bloomifiSpend[config.schema]) {
            bloomifiByBrand[brandKey] = bloomifiSpend[config.schema];
          }
        }

        // Process MASTER_TAB_BRANDS into groups of 4
        const brandGroups: MonthlyBrandGroup[] = [];
        for (let i = 0; i < MASTER_TAB_BRANDS.length; i += MASTER_TAB_GROUP_SIZE) {
          const groupEntries = MASTER_TAB_BRANDS.slice(i, i + MASTER_TAB_GROUP_SIZE);
          const groupName = groupEntries[groupEntries.length - 1]?.display_name.replace(" (Total)", "") || "";

          const rows: MonthlyBrandGroup["rows"] = [];

          for (const entry of groupEntries) {
            let spend = 0;
            let sales = 0;

            if (entry.source === "database" && entry.brand_key) {
              const t = dbTotals[entry.brand_key];
              spend = t ? Math.round(t.spend) : 0;
              sales = t ? Math.round(t.sales) : 0;
            } else if (entry.source === "database_sum" && entry.brand_keys) {
              for (const bk of entry.brand_keys) {
                const t = dbTotals[bk];
                if (t) {
                  spend += Math.round(t.spend);
                  sales += Math.round(t.sales);
                }
              }
            } else if (entry.source === "sheet") {
              const amazonEntry = groupEntries.find(
                (e) => e.source === "database" || e.source === "database_sum"
              );
              const label = entry.display_name.includes("Bloomifi")
                ? "bloomifi"
                : "dsp";

              if (label === "bloomifi") {
                if (amazonEntry?.source === "database_sum" && amazonEntry.brand_keys) {
                  for (const bk of amazonEntry.brand_keys) {
                    spend += bloomifiByBrand[bk] || 0;
                  }
                } else if (amazonEntry?.brand_key) {
                  spend = bloomifiByBrand[amazonEntry.brand_key] || 0;
                }
              } else {
                if (amazonEntry?.source === "database_sum" && amazonEntry.brand_keys) {
                  for (const bk of amazonEntry.brand_keys) {
                    const d = dspTotals[bk];
                    if (d) {
                      spend += d.spend;
                      sales += d.sales;
                    }
                  }
                } else if (amazonEntry?.brand_key) {
                  const d = dspTotals[amazonEntry.brand_key];
                  if (d) {
                    spend = d.spend;
                    sales = d.sales;
                  }
                }
              }
            } else if (entry.source === "sum_above") {
              for (const prevRow of rows.slice(-3)) {
                spend += prevRow.spend;
                sales += prevRow.sales;
              }
            }

            const tacos = sales > 0 ? spend / sales : 0;
            const roas = spend > 0 ? sales / spend : 0;

            rows.push({
              label: entry.display_name,
              spend,
              sales,
              tacos: Math.round(tacos * 10000) / 10000,
              roas: Math.round(roas * 100) / 100,
            });
          }

          brandGroups.push({ display_name: groupName, rows });
        }

        return {
          month: monthStr,
          year: monthDate.getFullYear(),
          brand_groups: brandGroups,
        };
      },
      { bypass: refresh }
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Monthly API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly data" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Compiles without errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/monthly/route.ts
git commit -m "feat: wrap monthly API in response cache"
```

---

### Task 8: Add Refresh Button to All Pages

**Files:**
- Modify: `src/app/daily/page.tsx`
- Modify: `src/app/monthly/page.tsx`
- Modify: `src/app/brand/[slug]/page.tsx`

- [ ] **Step 1: Add refresh button to daily page**

In `src/app/daily/page.tsx`, add `RefreshCw` to the lucide-react import (line 5):

Replace:
```typescript
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
```
With:
```typescript
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
```

Update `fetchData` to accept an optional `refresh` parameter (replace lines 28-42):

```typescript
  const fetchData = useCallback(async (d: Date, refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = format(d, "yyyy-MM-dd");
      const params = new URLSearchParams({ date: dateStr });
      if (refresh) params.set("refresh", "true");
      const res = await fetch(`/api/daily?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);
```

Add a refresh handler after `goToYesterday` (after line 51):

```typescript
  const handleRefresh = () => { if (date) fetchData(date, true); };
```

Add the refresh button in the header controls, right before the `Yesterday` button (before the line with `<Button variant="secondary" size="sm" onClick={goToYesterday}>`):

```tsx
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={!date || loading} title="Refresh data">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
```

- [ ] **Step 2: Add refresh button to monthly page**

In `src/app/monthly/page.tsx`, add `RefreshCw` to the lucide-react import (line 5):

Replace:
```typescript
import { ChevronLeft, ChevronRight, SquareStack, LayoutGrid, Table2 } from "lucide-react";
```
With:
```typescript
import { ChevronLeft, ChevronRight, SquareStack, LayoutGrid, Table2, RefreshCw } from "lucide-react";
```

Update `fetchData` to accept an optional `refresh` parameter (replace lines 30-44):

```typescript
  const fetchData = useCallback(async (d: Date, refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const monthStr = format(d, "yyyy-MM");
      const params = new URLSearchParams({ month: monthStr });
      if (refresh) params.set("refresh", "true");
      const res = await fetch(`/api/monthly?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);
```

Add a refresh handler after `goToThisMonth` (after line 52):

```typescript
  const handleRefresh = () => { if (monthDate) fetchData(monthDate, true); };
```

Add the refresh button right before the `This Month` button:

```tsx
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={!monthDate || loading} title="Refresh data">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
```

- [ ] **Step 3: Add refresh button to brand page**

In `src/app/brand/[slug]/page.tsx`, add `RefreshCw` to the imports. Add a new import after the existing ones (after line 12):

```typescript
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
```

Update `fetchData` to accept an optional `refresh` parameter (replace lines 33-47):

```typescript
  const fetchData = useCallback(async (refresh = false) => {
    if (!dateRange) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from: dateRange.from, to: dateRange.to });
      if (refresh) params.set("refresh", "true");
      const res = await fetch(`/api/brand/${slug}?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [slug, dateRange]);
```

Add a refresh handler after the `fetchData` definition:

```typescript
  const handleRefresh = () => fetchData(true);
```

Add the refresh button next to the date range display in the header (replace the date range span area, lines 72-78):

```tsx
        <div className="flex items-center gap-2">
          {dateRange ? (
            <span className="text-sm text-muted-foreground">
              {dateRange.from} to {dateRange.to}
            </span>
          ) : (
            <Skeleton className="h-5 w-48 rounded" />
          )}
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={!dateRange || loading} title="Refresh data">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Compiles without errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/daily/page.tsx src/app/monthly/page.tsx src/app/brand/[slug]/page.tsx
git commit -m "feat: add refresh button to all pages for cache bypass"
```

---

### Task 9: Manual Verification

- [ ] **Step 1: Start dev server and test daily page**

Run: `npm run dev`

Open `http://localhost:3000/daily`. Verify:
- Page loads and shows data
- Refresh button is visible and spins while loading
- Clicking refresh reloads data
- Second load of same date is noticeably faster (cache hit)

- [ ] **Step 2: Test monthly page**

Navigate to `/monthly`. Verify:
- Page loads and shows data
- Refresh button works
- Second load of same month is faster

- [ ] **Step 3: Test brand detail page**

Navigate to `/brand/herbivore` (or any brand). Verify:
- Page loads with full month range
- Load time is significantly faster than before (2 queries vs ~124)
- Refresh button works
- Second load is instant (cache hit)

- [ ] **Step 4: Test today's date is not cached**

On the daily page, navigate to today's date. Load it twice — both loads should take the same time (no caching for today).

- [ ] **Step 5: Final production build check**

Run: `npm run build`
Expected: Compiles without errors or warnings.
