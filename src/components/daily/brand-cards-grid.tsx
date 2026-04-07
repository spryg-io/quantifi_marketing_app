"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { BRANDS_CONFIG, ROW_LABELS } from "@/lib/constants";
import { formatCurrency, formatRoas, formatPercent, cn } from "@/lib/utils";
import { HighlightableCell } from "@/components/highlights/highlightable-cell";
import { HighlightableMetric } from "@/components/highlights/highlightable-metric";
import { DeltaIndicator, InlineDelta } from "@/components/daily/delta-indicator";
import type { BrandDailyData } from "@/lib/types";

interface BrandCardsGridProps {
  brands: Record<string, BrandDailyData>;
  brandOrder: string[];
  compareBrands?: Record<string, BrandDailyData>;
}

const ROW_LABEL_LIST = ROW_LABELS.map((r) => r.label);

export function BrandCardsGrid({ brands, brandOrder, compareBrands }: BrandCardsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {brandOrder.map((key) => {
        const b = brands[key];
        if (!b) return null;
        return <BrandCard key={key} brandKey={key} data={b} compareData={compareBrands?.[key]} />;
      })}
    </div>
  );
}

function BrandCard({ brandKey, data, compareData }: { brandKey: string; data: BrandDailyData; compareData?: BrandDailyData }) {
  const config = BRANDS_CONFIG[brandKey];
  const name = config?.display_name || brandKey;
  const totalSpend = data.total_ad_spend + data.bloomifi_spend + data.dsp_spend;
  const cmpTotalSpend = compareData ? compareData.total_ad_spend + compareData.bloomifi_spend + compareData.dsp_spend : undefined;

  const hasActivity = totalSpend > 0 || data.total_sales > 0;

  // Determine a color accent based on spend vs sales health
  const ratio = data.spend_vs_sales;
  const healthColor =
    ratio === 0
      ? "border-slate-200"
      : ratio <= 0.15
        ? "border-green-400"
        : ratio <= 0.25
          ? "border-yellow-400"
          : "border-red-400";

  return (
    <div
      className={cn(
        "border-2 rounded-lg bg-white overflow-hidden transition-shadow hover:shadow-md",
        healthColor
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <Link
          href={`/brand/${brandKey}`}
          className="font-semibold text-blue-600 hover:underline flex items-center gap-1.5"
        >
          {name}
          <ExternalLink className="h-3 w-3" />
        </Link>
        {hasActivity && data.spend_vs_sales > 0 && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              ratio <= 0.15
                ? "bg-green-100 text-green-700"
                : ratio <= 0.25
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
            )}
          >
            {formatPercent(data.spend_vs_sales)}
          </span>
        )}
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-3 divide-x divide-slate-100">
        <KpiCell cellKey={`${brandKey}:_total:spend`} label="Spend" value={totalSpend > 0 ? formatCurrency(totalSpend) : "-"} current={totalSpend} previous={cmpTotalSpend} invertColor />
        <KpiCell cellKey={`${brandKey}:total_sales:value`} label="Total Sales" value={data.total_sales > 0 ? formatCurrency(data.total_sales) : "-"} current={data.total_sales} previous={compareData?.total_sales} />
        <KpiCell cellKey={`${brandKey}:_total:roas`} label="ROAS" value={data.roas > 0 ? formatRoas(data.roas) : "-"} current={data.roas} previous={compareData?.roas} />
      </div>

      <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
        <KpiCell cellKey={`${brandKey}:_total:sales`} label="Ad Sales" value={data.total_ad_sales > 0 ? formatCurrency(data.total_ad_sales) : "-"} current={data.total_ad_sales} previous={compareData?.total_ad_sales} subtle />
        <KpiCell cellKey={`${brandKey}:total_sales:troas`} label="TROAS" value={data.troas > 0 ? formatRoas(data.troas) : "-"} current={data.troas} previous={compareData?.troas} subtle />
        <KpiCell cellKey={`${brandKey}:Bloomifi:spend`} label="Bloomifi" value={data.bloomifi_spend > 0 ? formatCurrency(data.bloomifi_spend) : "-"} current={data.bloomifi_spend} previous={compareData?.bloomifi_spend} invertColor subtle />
      </div>

      {/* Campaign breakdown */}
      {hasActivity && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          <table className="text-sm w-full">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200/60">
                <th className="text-left py-1.5 pl-4 pr-2 font-medium">Type</th>
                <th className="text-right py-1.5 px-2 font-medium">Spend</th>
                <th className="text-right py-1.5 px-2 font-medium">Sales</th>
                <th className="text-right py-1.5 px-2 font-medium">ROAS</th>
                <th className="text-right py-1.5 pl-2 pr-4 font-medium">MTD ROAS</th>
              </tr>
            </thead>
            <tbody>
              {ROW_LABEL_LIST.map((label) => {
                const d = data.campaigns[label];
                if (!d || (d.spend === 0 && d.sales === 0)) return null;
                const cd = compareData?.campaigns[label];
                return (
                  <tr key={label} className="border-b border-slate-200/40">
                    <td className="py-1 pl-4 pr-2 text-slate-600">{label}</td>
                    <HighlightableCell cellKey={`${brandKey}:${label}:spend`} className="py-1 px-2 text-right tabular-nums">
                      {formatCurrency(d.spend)}
                      {cd !== undefined && <InlineDelta current={d.spend} previous={cd.spend} invertColor />}
                    </HighlightableCell>
                    <HighlightableCell cellKey={`${brandKey}:${label}:sales`} className="py-1 px-2 text-right tabular-nums">
                      {formatCurrency(d.sales)}
                      {cd !== undefined && <InlineDelta current={d.sales} previous={cd.sales} />}
                    </HighlightableCell>
                    <HighlightableCell cellKey={`${brandKey}:${label}:roas`} className="py-1 px-2 text-right tabular-nums">
                      {d.roas > 0 ? formatRoas(d.roas) : "-"}
                      {cd !== undefined && <InlineDelta current={d.roas} previous={cd.roas} />}
                    </HighlightableCell>
                    <td className="py-1 pl-2 pr-4 text-right tabular-nums">
                      {data.mtd_campaigns[label]?.roas > 0 ? formatRoas(data.mtd_campaigns[label].roas) : "-"}
                    </td>
                  </tr>
                );
              })}
              {data.bloomifi_spend > 0 && (
                <tr className="border-b border-slate-200/40">
                  <td className="py-1 pl-4 pr-2 text-slate-600">Bloomifi</td>
                  <HighlightableCell cellKey={`${brandKey}:Bloomifi:spend`} className="py-1 px-2 text-right tabular-nums">
                    {formatCurrency(data.bloomifi_spend)}
                    {compareData !== undefined && <InlineDelta current={data.bloomifi_spend} previous={compareData.bloomifi_spend} invertColor />}
                  </HighlightableCell>
                  <td className="py-1 px-2 text-right tabular-nums">-</td>
                  <td className="py-1 px-2 text-right tabular-nums">-</td>
                  <td className="py-1 pl-2 pr-4 text-right tabular-nums">-</td>
                </tr>
              )}
              {data.dsp_spend > 0 && (
                <tr className="border-b border-slate-200/40">
                  <td className="py-1 pl-4 pr-2 text-slate-600">DSP</td>
                  <HighlightableCell cellKey={`${brandKey}:DSP:spend`} className="py-1 px-2 text-right tabular-nums">
                    {formatCurrency(data.dsp_spend)}
                    {compareData !== undefined && <InlineDelta current={data.dsp_spend} previous={compareData.dsp_spend} invertColor />}
                  </HighlightableCell>
                  <HighlightableCell cellKey={`${brandKey}:DSP:sales`} className="py-1 px-2 text-right tabular-nums">
                    {data.dsp_sales > 0 ? formatCurrency(data.dsp_sales) : "-"}
                    {compareData !== undefined && <InlineDelta current={data.dsp_sales} previous={compareData.dsp_sales} />}
                  </HighlightableCell>
                  <td className="py-1 px-2 text-right tabular-nums">-</td>
                  <td className="py-1 pl-2 pr-4 text-right tabular-nums">-</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KpiCell({
  cellKey, label, value, subtle, current, previous, invertColor,
}: {
  cellKey: string; label: string; value: string; subtle?: boolean;
  current: number; previous?: number; invertColor?: boolean;
}) {
  return (
    <div className="relative">
      <HighlightableMetric cellKey={cellKey} label={label} value={value} subtle={subtle} />
      {previous !== undefined && (
        <div className={cn("px-3 -mt-1.5 pb-1", subtle && "pb-0.5")}>
          <DeltaIndicator current={current} previous={previous} invertColor={invertColor} />
        </div>
      )}
    </div>
  );
}
