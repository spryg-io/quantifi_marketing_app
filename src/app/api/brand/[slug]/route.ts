import { NextRequest, NextResponse } from "next/server";
import { format, startOfMonth, eachDayOfInterval, parse } from "date-fns";
import { BRANDS_CONFIG, ROW_LABELS } from "@/lib/constants";
import { getBrandDailyDataRange, getBrandTotalSalesRange } from "@/lib/queries/aggregation";
import { getCached } from "@/lib/cache";
import { normalizeRange } from "@/lib/dates";
import { checkBrandFreshness } from "@/lib/queries/freshness";
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
        const { from: actualFrom, to: actualTo } = normalizeRange(fromStr, toStr);
        const fromDate = parse(actualFrom, "yyyy-MM-dd", new Date());
        const toDate = parse(actualTo, "yyyy-MM-dd", new Date());
        const days = eachDayOfInterval({ start: fromDate, end: toDate });

        // Two queries instead of 2 * days.length
        const [campaignsByDate, salesByDate] = await Promise.all([
          getBrandDailyDataRange(slug, actualFrom, actualTo),
          getBrandTotalSalesRange(slug, actualFrom, actualTo),
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

        const freshness = await checkBrandFreshness(slug, actualTo);

        return {
          brand_key: slug,
          display_name: config.display_name,
          from: actualFrom,
          to: actualTo,
          time_series: timeSeries,
          campaign_breakdown: campaignBreakdown,
          freshness,
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
