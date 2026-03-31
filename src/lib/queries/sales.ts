import pool from "@/lib/db/postgres";

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
