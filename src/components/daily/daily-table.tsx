"use client";

import Link from "next/link";
import { BRANDS_CONFIG } from "@/lib/constants";
import { formatCurrency, formatRoas, formatPercent, cn } from "@/lib/utils";
import { HighlightableCell } from "@/components/highlights/highlightable-cell";
import type { BrandDailyData } from "@/lib/types";

interface DailyTableProps {
  brands: Record<string, BrandDailyData>;
  brandOrder: string[];
  rowLabels: string[];
}

export function DailyTable({ brands, brandOrder, rowLabels }: DailyTableProps) {
  return (
    <div className="overflow-x-auto border rounded-lg bg-white">
      <table className="border-collapse text-sm w-full">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white border-b border-r px-3 py-2 text-left font-semibold w-32 min-w-[8rem]">
              Campaign
            </th>
            {brandOrder.map((key, idx) => {
              const config = BRANDS_CONFIG[key];
              const bg = idx % 2 === 0 ? "bg-white" : "bg-slate-50";
              return (
                <th
                  key={key}
                  colSpan={3}
                  className={cn(
                    "border-b px-2 py-2 text-center font-semibold",
                    bg
                  )}
                >
                  <Link
                    href={`/brand/${key}`}
                    className="text-blue-600 hover:underline"
                  >
                    {config?.display_name || key}
                  </Link>
                </th>
              );
            })}
          </tr>
          <tr>
            <th className="sticky left-0 z-10 bg-white border-b border-r px-3 py-1 text-left text-xs text-slate-500">
              Type
            </th>
            {brandOrder.map((key, idx) => {
              const bg = idx % 2 === 0 ? "bg-white" : "bg-slate-50";
              return (
                <Fragment key={key}>
                  <th className={cn("border-b px-2 py-1 text-right text-xs text-slate-500 min-w-[5.5rem]", bg)}>
                    Spend
                  </th>
                  <th className={cn("border-b px-2 py-1 text-right text-xs text-slate-500 min-w-[5.5rem]", bg)}>
                    Ad Sales
                  </th>
                  <th className={cn("border-b px-2 py-1 text-right text-xs text-slate-500 min-w-[4.5rem]", bg)}>
                    ROAS
                  </th>
                </Fragment>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {/* Campaign rows */}
          {rowLabels.map((label) => (
            <tr key={label} className="hover:bg-slate-50/50">
              <td className="sticky left-0 z-10 bg-white border-b border-r px-3 py-1.5 font-medium text-slate-700 whitespace-nowrap">
                {label}
              </td>
              {brandOrder.map((key, idx) => {
                const b = brands[key];
                const data = b?.campaigns[label];
                const bg = idx % 2 === 0 ? "" : "bg-slate-50";
                return (
                  <Fragment key={key}>
                    <HighlightableCell cellKey={`${key}:${label}:spend`} className={cn("border-b px-2 py-1.5 text-right tabular-nums", bg)}>
                      {data && data.spend > 0 ? formatCurrency(data.spend) : ""}
                    </HighlightableCell>
                    <HighlightableCell cellKey={`${key}:${label}:sales`} className={cn("border-b px-2 py-1.5 text-right tabular-nums", bg)}>
                      {data && data.sales > 0 ? formatCurrency(data.sales) : ""}
                    </HighlightableCell>
                    <HighlightableCell cellKey={`${key}:${label}:roas`} className={cn("border-b px-2 py-1.5 text-right tabular-nums", bg)}>
                      {data && data.roas > 0 ? formatRoas(data.roas) : ""}
                    </HighlightableCell>
                  </Fragment>
                );
              })}
            </tr>
          ))}

          {/* Bloomifi row */}
          <tr className="hover:bg-slate-50/50">
            <td className="sticky left-0 z-10 bg-white border-b border-r px-3 py-1.5 font-medium text-slate-700">
              Bloomifi
            </td>
            {brandOrder.map((key, idx) => {
              const b = brands[key];
              const bg = idx % 2 === 0 ? "" : "bg-slate-50";
              return (
                <Fragment key={key}>
                  <HighlightableCell cellKey={`${key}:Bloomifi:spend`} className={cn("border-b px-2 py-1.5 text-right tabular-nums", bg)}>
                    {b && b.bloomifi_spend > 0 ? formatCurrency(b.bloomifi_spend) : ""}
                  </HighlightableCell>
                  <td className={cn("border-b px-2 py-1.5 text-right", bg)} />
                  <td className={cn("border-b px-2 py-1.5 text-right", bg)} />
                </Fragment>
              );
            })}
          </tr>

          {/* DSP row */}
          <tr className="hover:bg-slate-50/50">
            <td className="sticky left-0 z-10 bg-white border-b border-r px-3 py-1.5 font-medium text-slate-700">
              DSP
            </td>
            {brandOrder.map((key, idx) => {
              const b = brands[key];
              const bg = idx % 2 === 0 ? "" : "bg-slate-50";
              return (
                <Fragment key={key}>
                  <HighlightableCell cellKey={`${key}:DSP:spend`} className={cn("border-b px-2 py-1.5 text-right tabular-nums", bg)}>
                    {b && b.dsp_spend > 0 ? formatCurrency(b.dsp_spend) : ""}
                  </HighlightableCell>
                  <HighlightableCell cellKey={`${key}:DSP:sales`} className={cn("border-b px-2 py-1.5 text-right tabular-nums", bg)}>
                    {b && b.dsp_sales > 0 ? formatCurrency(b.dsp_sales) : ""}
                  </HighlightableCell>
                  <td className={cn("border-b px-2 py-1.5 text-right", bg)} />
                </Fragment>
              );
            })}
          </tr>

          {/* Total Spend row */}
          <tr className="bg-[var(--light-blue)]">
            <td className="sticky left-0 z-10 bg-[var(--light-blue)] border-b border-r px-3 py-2 font-bold text-slate-900">
              Total Spend
            </td>
            {brandOrder.map((key, idx) => {
              const b = brands[key];
              const totalSpend = b ? b.total_ad_spend + b.bloomifi_spend + b.dsp_spend : 0;
              const totalAdSales = b ? b.total_ad_sales : 0;
              const roas = b ? b.roas : 0;
              return (
                <Fragment key={key}>
                  <HighlightableCell cellKey={`${key}:$$:spend`} className="border-b px-2 py-2 text-right font-bold tabular-nums">
                    {totalSpend > 0 ? formatCurrency(totalSpend) : ""}
                  </HighlightableCell>
                  <HighlightableCell cellKey={`${key}:$$:sales`} className="border-b px-2 py-2 text-right font-bold tabular-nums">
                    {totalAdSales > 0 ? formatCurrency(totalAdSales) : ""}
                  </HighlightableCell>
                  <HighlightableCell cellKey={`${key}:$$:roas`} className="border-b px-2 py-2 text-right font-bold tabular-nums">
                    {roas > 0 ? formatRoas(roas) : ""}
                  </HighlightableCell>
                </Fragment>
              );
            })}
          </tr>

          {/* Total Sales row */}
          <tr className="bg-[var(--medium-blue)]">
            <td className="sticky left-0 z-10 bg-[var(--medium-blue)] border-b border-r px-3 py-2 font-bold text-white">
              Total Sales
            </td>
            {brandOrder.map((key) => {
              const b = brands[key];
              return (
                <Fragment key={key}>
                  <HighlightableCell cellKey={`${key}:total_sales:value`} className="border-b px-2 py-2 text-right font-bold text-white tabular-nums">
                    {b && b.total_sales > 0 ? formatCurrency(b.total_sales) : ""}
                  </HighlightableCell>
                  <td className="border-b px-2 py-2 text-right font-bold text-white text-xs">
                    TROAS
                  </td>
                  <HighlightableCell cellKey={`${key}:total_sales:troas`} className="border-b px-2 py-2 text-right font-bold text-white tabular-nums">
                    {b && b.troas > 0 ? formatRoas(b.troas) : ""}
                  </HighlightableCell>
                </Fragment>
              );
            })}
          </tr>

          {/* Spend vs Sales % row */}
          <tr>
            <td className="sticky left-0 z-10 bg-white border-r px-3 py-2 font-bold text-slate-700">
              SPEND VS SALES %
            </td>
            {brandOrder.map((key, idx) => {
              const b = brands[key];
              const bg = idx % 2 === 0 ? "" : "bg-slate-50";
              return (
                <Fragment key={key}>
                  <td className={cn("px-2 py-2 text-right", bg)} />
                  <td className={cn("px-2 py-2 text-right", bg)} />
                  <HighlightableCell cellKey={`${key}:spend_vs_sales:value`} className={cn("px-2 py-2 text-right font-bold tabular-nums", bg)}>
                    {b && b.spend_vs_sales > 0 ? formatPercent(b.spend_vs_sales) : ""}
                  </HighlightableCell>
                </Fragment>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// React Fragment helper
function Fragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
