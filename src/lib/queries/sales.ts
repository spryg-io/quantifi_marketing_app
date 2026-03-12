import pool from "@/lib/db/postgres";

/**
 * Get total sales for a brand on a given date from sales_order table.
 * Faithful translation of MarketingDataPuller.get_daily_total_sales()
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
    WHERE DATE(purchase_date AT TIME ZONE 'America/Los_Angeles') = $1
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

/**
 * Get monthly total sales from sales_order table.
 * Faithful translation of MarketingDataPuller.get_monthly_totals() (sales part)
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
    WHERE DATE(purchase_date AT TIME ZONE 'America/Los_Angeles') >= $1
      AND DATE(purchase_date AT TIME ZONE 'America/Los_Angeles') <= $2
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
