# Data Loading Performance Optimization

**Date:** 2026-03-31
**Status:** Approved
**Goal:** Reduce page load times across daily, monthly, and brand detail pages by consolidating database queries and adding a server-side response cache.

## Context

The app is deployed on-prem while the PostgreSQL database is on AWS. Every page load fires 50-120+ individual queries across a high-latency network link, with no caching. Five internal users typically load the same pages (same dates) each morning after a scheduled data sync.

### Current Query Counts Per Page Load

| Page | Queries | Why |
|-|-|-|
| Brand detail (1 month) | ~124 | 31 days x 2 queries/day, each campaign query = 3-table UNION ALL |
| Daily | ~56 | 14 brands x 4 queries (campaigns, sales, DSP, MTD) |
| Monthly | ~30 | 14 brands x ~2 queries |

### Root Causes

1. **Brand detail page loops per-day** — fires `getBrandDailyData` + `getBrandTotalSales` for each day in the date range individually.
2. **No caching** — identical requests from multiple users all hit Postgres every time.
3. **Sales query prevents index usage** — `DATE(purchase_date AT TIME ZONE 'America/Los_Angeles') = $1` wraps the column in a function, forcing full table scans.

## Design

### 1. Query Consolidation (Brand Detail Page)

Replace the per-day query loop with range queries that return data grouped by date.

**Before:**
```
for each day in [from..to]:
  getBrandDailyData(brand, day)      // 3-table UNION ALL, single date
  getBrandTotalSales(brand, day)     // sales_order query, single date
```

**After:**
```
getBrandCampaignDataGrouped(brand, from, to)   // 3-table UNION ALL, GROUP BY date
getBrandTotalSalesRange(brand, from, to)        // sales_order, GROUP BY date
```

Aggregate into time series and campaign breakdown in JS (same logic, just done once over the grouped result instead of per-day).

**Impact:** ~124 queries down to 2 for a month-long range.

### 2. Sales Query Index Fix

Replace function-on-column with a range comparison so Postgres can use an index on `purchase_date`.

**Before:**
```sql
WHERE DATE(purchase_date AT TIME ZONE 'America/Los_Angeles') = $1
```

**After:**
```sql
WHERE purchase_date >= $1::timestamp AT TIME ZONE 'America/Los_Angeles'
  AND purchase_date < ($1::date + 1)::timestamp AT TIME ZONE 'America/Los_Angeles'
```

Apply to both `getDailyTotalSales` and `getMonthlySales` in `sales.ts`.

### 3. In-Memory Response Cache

A shared `Map<string, { data, timestamp }>` used by all API route handlers.

**Rules:**
- **Cache key** = endpoint + params (e.g., `daily:2026-03-30`, `brand:herbivore:2026-03-01:2026-03-30`)
- **TTL** = 30 minutes for past dates
- **Never cache today's date** — incomplete data should always be fresh
- **Manual bypass** = `?refresh=true` query param skips cache read but still writes the fresh result to cache
- **Scope** = Node.js process memory. No external infrastructure. Resets on deploy/restart.

**Implementation:** A single `src/lib/cache.ts` module exporting `getCached(key, ttlMs, fetcher)` and a bypass mechanism. Each API route wraps its data-fetching logic in this utility.

### 4. Manual Refresh Button (UI)

A refresh icon button on daily, monthly, and brand detail pages. Clicking it re-fetches data with `?refresh=true` appended to the API call. No full page reload — just updates React state with fresh data.

## Files Changed

| Area | File | Change |
|-|-|-|
| New utility | `src/lib/cache.ts` | Shared TTL cache with bypass support |
| Query consolidation | `src/lib/queries/campaigns.ts` | Add `getCampaignDataRangeGrouped()` — returns campaign data grouped by date |
| Query consolidation | `src/lib/queries/sales.ts` | Add `getDailyTotalSalesRange()` — returns sales grouped by date. Fix timezone wrapping on existing functions. |
| Brand API | `src/app/api/brand/[slug]/route.ts` | Use new range queries instead of per-day loop. Wrap response in cache. |
| Daily API | `src/app/api/daily/route.ts` | Wrap response in cache. |
| Monthly API | `src/app/api/monthly/route.ts` | Wrap response in cache. |
| UI | Daily, Monthly, Brand page components | Add refresh button passing `?refresh=true` to API calls. |

## What's NOT Changing

- No new infrastructure (no Redis, no cron jobs, no message queues)
- No SSR/streaming conversion — pages stay client-rendered
- No database schema changes — only query rewrites
- No changes to authentication, highlights, or DSP entry flows
- No changes to the Bloomifi DB queries

## Expected Impact

| Page | Before (queries) | After (queries) | Cache hit |
|-|-|-|-|
| Brand detail (1 month) | ~124 | 2-3 | Instant (0 queries) |
| Daily | ~56 | ~56 (parallel, wall-clock dominated by slowest) | Instant (0 queries) |
| Monthly | ~30 | ~30 | Instant (0 queries) |

The biggest win is brand detail (query consolidation) and repeated loads within 30 min across all pages (cache hits).
