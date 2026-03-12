import bloomifiPool from "@/lib/db/bloomifi";

/**
 * Get daily Bloomifi spend for all brands.
 * Faithful translation of MarketingDataPuller.get_bloomifi_daily_spend()
 *
 * Queries the bloomifi database, joining CampaignSpendRecord -> Campaign -> Brand,
 * grouped by Brand.schemaName. brandSpend values are stored in cents, converted to dollars.
 *
 * Returns: Dict mapping schema_name -> spend (in dollars)
 */
export async function getBloomifiDailySpend(
  targetDate: string
): Promise<Record<string, number>> {
  const query = `
    SELECT b."schemaName",
           SUM(csr."brandSpend") as total_spend_cents
    FROM public."CampaignSpendRecord" csr
    JOIN public."Campaign" c ON csr."campaignId" = c.id
    JOIN public."Brand" b ON c."brandId" = b.id
    WHERE csr."recordDate" = $1
    GROUP BY b."schemaName"
  `;

  try {
    const result = await bloomifiPool.query(query, [targetDate]);
    const spendBySchema: Record<string, number> = {};
    for (const row of result.rows) {
      spendBySchema[row.schemaName] = parseFloat(row.total_spend_cents) / 100.0;
    }
    return spendBySchema;
  } catch (error) {
    console.error("Error fetching Bloomifi spend:", error);
    return {};
  }
}

/**
 * Get monthly Bloomifi spend for all brands.
 */
export async function getBloomifiMonthlySpend(
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  const query = `
    SELECT b."schemaName",
           SUM(csr."brandSpend") as total_spend_cents
    FROM public."CampaignSpendRecord" csr
    JOIN public."Campaign" c ON csr."campaignId" = c.id
    JOIN public."Brand" b ON c."brandId" = b.id
    WHERE csr."recordDate" >= $1 AND csr."recordDate" <= $2
    GROUP BY b."schemaName"
  `;

  try {
    const result = await bloomifiPool.query(query, [startDate, endDate]);
    const spendBySchema: Record<string, number> = {};
    for (const row of result.rows) {
      spendBySchema[row.schemaName] = parseFloat(row.total_spend_cents) / 100.0;
    }
    return spendBySchema;
  } catch (error) {
    console.error("Error fetching monthly Bloomifi spend:", error);
    return {};
  }
}
