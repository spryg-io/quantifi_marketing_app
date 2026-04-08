import pool from "@/lib/db/postgres";
import { ALL_BRANDS, BRANDS_CONFIG } from "@/lib/constants";
import type { BrandFreshness } from "@/lib/types";

/**
 * Check the latest date with data in a brand's SP campaign table.
 * SP is the most commonly populated table so it's a good canary.
 */
async function getLatestCampaignDate(schema: string): Promise<string | null> {
  const query = `
    SELECT MAX(date)::text as latest
    FROM ${schema}.advertising_spcampaignreport
  `;

  try {
    const result = await pool.query(query);
    return result.rows[0]?.latest || null;
  } catch {
    return null;
  }
}

/**
 * Check the latest date with data in a brand's sales_order table.
 */
async function getLatestSalesDate(
  schema: string,
  salesChannel?: string
): Promise<string | null> {
  const channelFilter = salesChannel ? "WHERE sales_channel = $1" : "";
  const query = `
    SELECT MAX(DATE(purchase_date AT TIME ZONE 'America/Los_Angeles'))::text as latest
    FROM ${schema}.sales_order
    ${channelFilter}
  `;

  try {
    const params = salesChannel ? [salesChannel] : [];
    const result = await pool.query(query, params);
    return result.rows[0]?.latest || null;
  } catch {
    return null;
  }
}

/**
 * Check data freshness for a single brand against a target date.
 */
export async function checkBrandFreshness(
  brandKey: string,
  targetDate: string
): Promise<BrandFreshness> {
  const config = BRANDS_CONFIG[brandKey];
  if (!config) return { status: "missing", latest_campaign: null, latest_sales: null };

  const [latestCampaign, latestSales] = await Promise.all([
    getLatestCampaignDate(config.schema),
    getLatestSalesDate(config.schema, config.sales_channel),
  ]);

  let status: BrandFreshness["status"] = "ok";
  if (!latestCampaign && !latestSales) {
    status = "missing";
  } else {
    // Use the most recent of the two dates — stale only if both sources are behind
    const latest = [latestCampaign, latestSales].filter(Boolean).sort().pop()!;
    if (latest < targetDate) {
      status = "stale";
    }
  }

  return { status, latest_campaign: latestCampaign, latest_sales: latestSales };
}

/**
 * Check data freshness for all brands against a target date.
 * Returns a record of brand_key -> freshness info.
 *
 * For daily: targetDate is the specific day being viewed.
 * For monthly: targetDate is the last day of the range (endDate).
 */
export async function checkFreshness(
  targetDate: string
): Promise<Record<string, BrandFreshness>> {
  const results = await Promise.all(
    ALL_BRANDS.map(async (brandKey) => {
      const config = BRANDS_CONFIG[brandKey];
      if (!config) {
        return [brandKey, { status: "missing" as const, latest_campaign: null, latest_sales: null }];
      }

      const [latestCampaign, latestSales] = await Promise.all([
        getLatestCampaignDate(config.schema),
        getLatestSalesDate(config.schema, config.sales_channel),
      ]);

      let status: BrandFreshness["status"] = "ok";

      if (!latestCampaign && !latestSales) {
        status = "missing";
      } else {
        const latest = [latestCampaign, latestSales].filter(Boolean).sort().pop()!;
        if (latest < targetDate) {
          status = "stale";
        }
      }

      return [brandKey, { status, latest_campaign: latestCampaign, latest_sales: latestSales }];
    })
  );

  return Object.fromEntries(results);
}
