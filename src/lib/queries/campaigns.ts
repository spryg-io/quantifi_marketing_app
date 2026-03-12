import pool from "@/lib/db/postgres";
import type { CampaignRow } from "@/lib/types";

/**
 * Query SP, SB, SD campaign tables for a given brand schema and date.
 * Faithful translation of MarketingDataPuller.get_daily_campaign_data()
 */
export async function getDailyCampaignData(
  schema: string,
  targetDate: string
): Promise<CampaignRow[]> {
  const query = `
    SELECT campaign_name,
           COALESCE(spend, 0) as spend,
           COALESCE(sales_14d, 0) as sales,
           'SP' as ad_type
    FROM ${schema}.advertising_spcampaignreport
    WHERE date = $1
    UNION ALL
    SELECT campaign_name,
           COALESCE(cost, 0) as spend,
           COALESCE(attributed_sales_14d, 0) as sales,
           'SB' as ad_type
    FROM ${schema}.advertising_sbcampaignreport
    WHERE date = $1
    UNION ALL
    SELECT campaign_name,
           COALESCE(spend, 0) as spend,
           COALESCE(sales, 0) as sales,
           'SD' as ad_type
    FROM ${schema}.advertising_sdcampaignreport
    WHERE date = $1
  `;

  try {
    const result = await pool.query(query, [targetDate]);
    return result.rows.map((row) => ({
      campaign_name: row.campaign_name,
      spend: parseFloat(row.spend),
      sales: parseFloat(row.sales),
      ad_type: row.ad_type,
    }));
  } catch (error) {
    console.error(`Database error for ${schema}:`, error);
    return [];
  }
}

/**
 * Get monthly spend totals from ad tables for a brand schema.
 * Faithful translation of MarketingDataPuller.get_monthly_totals() (spend part)
 */
export async function getMonthlyAdSpend(
  schema: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const query = `
    SELECT
      COALESCE(SUM(spend), 0) as spend
    FROM ${schema}.advertising_spcampaignreport
    WHERE date >= $1 AND date <= $2
    UNION ALL
    SELECT
      COALESCE(SUM(cost), 0) as spend
    FROM ${schema}.advertising_sbcampaignreport
    WHERE date >= $1 AND date <= $2
    UNION ALL
    SELECT
      COALESCE(SUM(spend), 0) as spend
    FROM ${schema}.advertising_sdcampaignreport
    WHERE date >= $1 AND date <= $2
  `;

  try {
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows.reduce((sum, row) => sum + parseFloat(row.spend), 0);
  } catch (error) {
    console.error(`Monthly ad spend error for ${schema}:`, error);
    return 0;
  }
}
