import { NextRequest, NextResponse } from "next/server";
import { format, subDays } from "date-fns";
import { ALL_BRANDS, BRANDS_CONFIG, ROW_LABELS, BRAND_ORDER, SBL_BRAND_ORDER } from "@/lib/constants";
import { getBrandDailyData, getBrandTotalSales, getBrandMTDData } from "@/lib/queries/aggregation";
import { getBloomifiDailySpend } from "@/lib/queries/bloomifi";
import { getDailyDspData } from "@/lib/queries/campaigns";
import { getExchangeRate } from "@/lib/currency";
import type { BrandDailyData, DailyResponse } from "@/lib/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateStr = searchParams.get("date") || format(subDays(new Date(), 1), "yyyy-MM-dd");

  try {
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

    const response: DailyResponse = {
      date: dateStr,
      brands,
      brand_order: BRAND_ORDER,
      sbl_brand_order: SBL_BRAND_ORDER,
      row_labels: ROW_LABELS.map((r) => r.label),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Daily API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily data" },
      { status: 500 }
    );
  }
}
