import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatRoas } from "@/lib/utils";

interface MetricsGridProps {
  totals: {
    spend: number;
    sales: number;
    roas: number;
    total_sales: number;
    troas: number;
  };
}

export function MetricsGrid({ totals }: MetricsGridProps) {
  const cards = [
    { label: "Total Spend", value: formatCurrency(totals.spend) },
    { label: "Ad Sales", value: formatCurrency(totals.sales) },
    { label: "ROAS", value: formatRoas(totals.roas) },
    { label: "Total Sales", value: formatCurrency(totals.total_sales) },
    { label: "TROAS", value: formatRoas(totals.troas) },
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
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
