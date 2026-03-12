import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercent, formatRoas } from "@/lib/utils";
import type { BrandDailyData } from "@/lib/types";

interface SummaryCardsProps {
  brands: Record<string, BrandDailyData>;
  brandOrder: string[];
}

export function SummaryCards({ brands, brandOrder }: SummaryCardsProps) {
  let totalSpend = 0;
  let totalSales = 0;
  let totalAdSpend = 0;
  let totalAdSales = 0;
  let brandCount = 0;
  let roasSum = 0;
  let spendVsSalesSum = 0;

  for (const key of brandOrder) {
    const b = brands[key];
    if (!b) continue;
    totalSpend += b.total_ad_spend + b.bloomifi_spend + b.dsp_spend;
    totalSales += b.total_sales;
    totalAdSpend += b.total_ad_spend;
    totalAdSales += b.total_ad_sales;
    if (b.roas > 0) {
      roasSum += b.roas;
      brandCount++;
    }
    if (b.spend_vs_sales > 0) {
      spendVsSalesSum += b.spend_vs_sales;
    }
  }

  const avgRoas = brandCount > 0 ? roasSum / brandCount : 0;
  const avgSpendVsSales = brandCount > 0 ? spendVsSalesSum / brandCount : 0;

  const cards = [
    { label: "Total Spend", value: formatCurrency(totalSpend) },
    { label: "Total Sales", value: formatCurrency(totalSales) },
    { label: "Avg ROAS", value: formatRoas(avgRoas) },
    { label: "Avg Spend vs Sales", value: formatPercent(avgSpendVsSales) },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
