import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercent, formatRoas } from "@/lib/utils";
import { DeltaIndicator } from "@/components/daily/delta-indicator";
import type { BrandDailyData } from "@/lib/types";

interface SummaryCardsProps {
  brands: Record<string, BrandDailyData>;
  brandOrder: string[];
  compareBrands?: Record<string, BrandDailyData>;
}

function computeAggregates(brands: Record<string, BrandDailyData>, brandOrder: string[]) {
  let totalSpend = 0;
  let totalSales = 0;
  let brandCount = 0;
  let roasSum = 0;
  let spendVsSalesSum = 0;

  for (const key of brandOrder) {
    const b = brands[key];
    if (!b) continue;
    totalSpend += b.total_ad_spend + b.bloomifi_spend + b.dsp_spend;
    totalSales += b.total_sales;
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

  return { totalSpend, totalSales, avgRoas, avgSpendVsSales };
}

export function SummaryCards({ brands, brandOrder, compareBrands }: SummaryCardsProps) {
  const agg = computeAggregates(brands, brandOrder);
  const cmpAgg = compareBrands ? computeAggregates(compareBrands, brandOrder) : null;

  const cards: { label: string; value: string; current: number; previous: number | null; invertColor: boolean }[] = [
    { label: "Total Spend", value: formatCurrency(agg.totalSpend), current: agg.totalSpend, previous: cmpAgg?.totalSpend ?? null, invertColor: true },
    { label: "Total Sales", value: formatCurrency(agg.totalSales), current: agg.totalSales, previous: cmpAgg?.totalSales ?? null, invertColor: false },
    { label: "Avg ROAS", value: formatRoas(agg.avgRoas), current: agg.avgRoas, previous: cmpAgg?.avgRoas ?? null, invertColor: false },
    { label: "Avg Spend vs Sales", value: formatPercent(agg.avgSpendVsSales), current: agg.avgSpendVsSales, previous: cmpAgg?.avgSpendVsSales ?? null, invertColor: true },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
            {card.previous !== null && (
              <DeltaIndicator
                current={card.current}
                previous={card.previous}
                invertColor={card.invertColor}
                className="mt-0.5"
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
