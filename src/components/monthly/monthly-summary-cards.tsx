import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { MonthlyBrandGroup } from "@/lib/types";

interface MonthlySummaryCardsProps {
  brandGroups: MonthlyBrandGroup[];
}

export function MonthlySummaryCards({ brandGroups }: MonthlySummaryCardsProps) {
  let totalSpend = 0;
  let totalSales = 0;

  for (const group of brandGroups) {
    const totalRow = group.rows[group.rows.length - 1];
    if (totalRow) {
      totalSpend += totalRow.spend;
      totalSales += totalRow.sales;
    }
  }

  const tacos = totalSales > 0 ? totalSpend / totalSales : 0;
  const roas = totalSpend > 0 ? totalSales / totalSpend : 0;

  const cards = [
    { label: "Total Spend", value: formatCurrency(totalSpend) },
    { label: "Total Sales", value: formatCurrency(totalSales) },
    { label: "TACOS", value: formatPercent(tacos) },
    { label: "ROAS", value: `$${roas.toFixed(2)}` },
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
