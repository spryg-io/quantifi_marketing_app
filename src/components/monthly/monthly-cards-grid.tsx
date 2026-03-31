"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { HighlightableCell } from "@/components/highlights/highlightable-cell";
import { HighlightableMetric } from "@/components/highlights/highlightable-metric";
import type { MonthlyBrandGroup } from "@/lib/types";

interface MonthlyCardsGridProps {
  brandGroups: MonthlyBrandGroup[];
}

// Map display names back to brand slugs for linking
const BRAND_SLUG_MAP: Record<string, string> = {
  Herbivore: "herbivore",
  Iconic: "iconic_london",
  Hanni: "hanni",
  OneSkin: "oneskin",
  ACTIIV: "actiiv",
  Zenagen: "zenagen",
  Caldera: "caldera",
  Bioeffect: "bioeffect",
  Versed: "versed",
  SBL: "sbl_uk",
  TBS: "tbs",
};

export function MonthlyCardsGrid({ brandGroups }: MonthlyCardsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {brandGroups.map((group) => (
        <MonthlyBrandCard key={group.display_name} group={group} />
      ))}
    </div>
  );
}

function MonthlyBrandCard({ group }: { group: MonthlyBrandGroup }) {
  const totalRow = group.rows[group.rows.length - 1];
  const breakdownRows = group.rows.slice(0, -1);
  const slug = BRAND_SLUG_MAP[group.display_name];

  const tacos = totalRow?.tacos ?? 0;
  const healthColor =
    tacos === 0
      ? "border-slate-200"
      : tacos <= 0.15
        ? "border-green-400"
        : tacos <= 0.25
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
        {slug ? (
          <Link
            href={`/brand/${slug}`}
            className="font-semibold text-blue-600 hover:underline flex items-center gap-1.5"
          >
            {group.display_name}
            <ExternalLink className="h-3 w-3" />
          </Link>
        ) : (
          <span className="font-semibold text-slate-900">{group.display_name}</span>
        )}
        {tacos > 0 && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              tacos <= 0.15
                ? "bg-green-100 text-green-700"
                : tacos <= 0.25
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
            )}
          >
            {formatPercent(tacos)}
          </span>
        )}
      </div>

      {/* Total KPIs */}
      {totalRow && (
        <div className="grid grid-cols-4 divide-x divide-slate-100">
          <HighlightableMetric cellKey={`${group.display_name}:total:spend`} label="Spend" value={totalRow.spend > 0 ? formatCurrency(totalRow.spend) : "-"} />
          <HighlightableMetric cellKey={`${group.display_name}:total:sales`} label="Sales" value={totalRow.sales > 0 ? formatCurrency(totalRow.sales) : "-"} />
          <HighlightableMetric cellKey={`${group.display_name}:total:tacos`} label="TACOS" value={tacos > 0 ? formatPercent(tacos) : "-"} />
          <HighlightableMetric cellKey={`${group.display_name}:total:roas`} label="ROAS" value={totalRow.roas > 0 ? `$${totalRow.roas.toFixed(2)}` : "-"} />
        </div>
      )}

      {/* Breakdown */}
      <div className="border-t border-slate-100 bg-slate-50/50">
        <table className="text-sm w-full">
          <thead>
            <tr className="text-slate-500 border-b border-slate-200/60">
              <th className="text-left py-1.5 pl-4 pr-2 font-medium">Source</th>
              <th className="text-right py-1.5 px-2 font-medium">Spend</th>
              <th className="text-right py-1.5 px-2 font-medium">Sales</th>
              <th className="text-right py-1.5 pl-2 pr-4 font-medium">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {breakdownRows.map((row) => {
              if (row.spend === 0 && row.sales === 0) return null;
              // Extract just the source type from "Brand (Source)" label
              const sourceMatch = row.label.match(/\(([^)]+)\)/);
              const source = sourceMatch ? sourceMatch[1] : row.label;
              return (
                <tr key={row.label} className="border-b border-slate-200/40">
                  <td className="py-1 pl-4 pr-2 text-slate-600">{source}</td>
                  <HighlightableCell cellKey={`${group.display_name}:${row.label}:spend`} className="py-1 px-2 text-right tabular-nums">
                    {row.spend > 0 ? formatCurrency(row.spend) : "-"}
                  </HighlightableCell>
                  <HighlightableCell cellKey={`${group.display_name}:${row.label}:sales`} className="py-1 px-2 text-right tabular-nums">
                    {row.sales > 0 ? formatCurrency(row.sales) : "-"}
                  </HighlightableCell>
                  <HighlightableCell cellKey={`${group.display_name}:${row.label}:roas`} className="py-1 pl-2 pr-4 text-right tabular-nums">
                    {row.roas > 0 ? `$${row.roas.toFixed(2)}` : "-"}
                  </HighlightableCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-semibold tabular-nums mt-0.5 text-lg">{value}</p>
    </div>
  );
}
