import { NextRequest, NextResponse } from "next/server";
import { format, startOfMonth, endOfMonth, parse } from "date-fns";
import {
  BRANDS_CONFIG,
  MASTER_TAB_BRANDS,
  MASTER_TAB_GROUP_SIZE,
  ALL_BRANDS,
} from "@/lib/constants";
import { getMonthlyAdSpend } from "@/lib/queries/campaigns";
import { getMonthlySales } from "@/lib/queries/sales";
import { getBloomifiMonthlySpend } from "@/lib/queries/bloomifi";
import { getDspMonthlyTotals } from "@/lib/db/sqlite";
import { getExchangeRate } from "@/lib/currency";
import type { MonthlyBrandGroup, MonthlyResponse } from "@/lib/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const monthStr = searchParams.get("month") || format(new Date(), "yyyy-MM");

  try {
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
    const [bloomifiSpend, dspTotals, ...brandResults] = await Promise.all([
      getBloomifiMonthlySpend(startDate, endDate),
      Promise.resolve(getDspMonthlyTotals(monthStr)),
      ...Array.from(brandKeysNeeded).map(async (brandKey) => {
        const config = BRANDS_CONFIG[brandKey];
        if (!config) return { brandKey, spend: 0, sales: 0 };

        const [spend, sales] = await Promise.all([
          getMonthlyAdSpend(config.schema, startDate, endDate),
          getMonthlySales(config.schema, startDate, endDate, config.sales_channel),
        ]);

        // Currency conversion
        const currency = config.currency ?? "USD";
        let convertedSpend = spend;
        let convertedSales = sales;
        if (currency !== "USD") {
          const rate = await getExchangeRate(currency);
          convertedSpend = Math.round(spend * rate * 100) / 100;
          convertedSales = Math.round(sales * rate * 100) / 100;
        }

        return { brandKey, spend: convertedSpend, sales: convertedSales };
      }),
    ]);

    // Build DB totals lookup
    const dbTotals: Record<string, { spend: number; sales: number }> = {};
    for (const r of brandResults) {
      dbTotals[r.brandKey] = { spend: r.spend, sales: r.sales };
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
          // Bloomifi and DSP - determine which brand this refers to
          // Extract brand key from the group's first entry (Amazon row)
          const amazonEntry = groupEntries.find(
            (e) => e.source === "database" || e.source === "database_sum"
          );
          const label = entry.display_name.includes("Bloomifi")
            ? "bloomifi"
            : "dsp";

          if (label === "bloomifi") {
            if (amazonEntry?.source === "database_sum" && amazonEntry.brand_keys) {
              // SBL - sum across sub-brands
              for (const bk of amazonEntry.brand_keys) {
                spend += bloomifiByBrand[bk] || 0;
              }
            } else if (amazonEntry?.brand_key) {
              spend = bloomifiByBrand[amazonEntry.brand_key] || 0;
            }
          } else {
            // DSP
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
          // Sum the 3 rows above
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

    const response: MonthlyResponse = {
      month: monthStr,
      year: monthDate.getFullYear(),
      brand_groups: brandGroups,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Monthly API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly data" },
      { status: 500 }
    );
  }
}
