"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { BRANDS_CONFIG, ROW_LABELS } from "@/lib/constants";
import { formatCurrency, formatRoas, formatPercent, cn } from "@/lib/utils";
import { HighlightableCell } from "@/components/highlights/highlightable-cell";
import type { BrandDailyData } from "@/lib/types";

interface BrandSummaryTableProps {
  brands: Record<string, BrandDailyData>;
  brandOrder: string[];
}

type SortKey = "brand" | "spend" | "ad_sales" | "roas" | "total_sales" | "troas" | "spend_vs_sales";
type SortDir = "asc" | "desc";

function getBrandMetrics(key: string, b: BrandDailyData) {
  const totalSpend = b.total_ad_spend + b.bloomifi_spend + b.dsp_spend;
  return {
    key,
    name: BRANDS_CONFIG[key]?.display_name || key,
    spend: totalSpend,
    ad_sales: b.total_ad_sales,
    roas: b.roas,
    total_sales: b.total_sales,
    troas: b.troas,
    spend_vs_sales: b.spend_vs_sales,
    data: b,
  };
}

const ROW_LABEL_LIST = ROW_LABELS.map((r) => r.label);

export function BrandSummaryTable({ brands, brandOrder }: BrandSummaryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("brand");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);

  const rows = brandOrder
    .filter((key) => brands[key])
    .map((key) => getBrandMetrics(key, brands[key]));

  const sorted = [...rows].sort((a, b) => {
    if (sortKey === "brand") {
      const cmp = a.name.localeCompare(b.name);
      return sortDir === "asc" ? cmp : -cmp;
    }
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "brand" ? "asc" : "desc");
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedBrand((prev) => (prev === key ? null : key));
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <table className="text-sm w-full border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b">
            <th className="w-8 px-2 py-2.5" />
            <HeaderCell label="Brand" col="brand" onSort={handleSort}><SortIcon col="brand" /></HeaderCell>
            <HeaderCell label="Total Spend" col="spend" onSort={handleSort} right><SortIcon col="spend" /></HeaderCell>
            <HeaderCell label="Ad Sales" col="ad_sales" onSort={handleSort} right><SortIcon col="ad_sales" /></HeaderCell>
            <HeaderCell label="ROAS" col="roas" onSort={handleSort} right><SortIcon col="roas" /></HeaderCell>
            <HeaderCell label="Total Sales" col="total_sales" onSort={handleSort} right><SortIcon col="total_sales" /></HeaderCell>
            <HeaderCell label="TROAS" col="troas" onSort={handleSort} right><SortIcon col="troas" /></HeaderCell>
            <HeaderCell label="Spend vs Sales" col="spend_vs_sales" onSort={handleSort} right><SortIcon col="spend_vs_sales" /></HeaderCell>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const isExpanded = expandedBrand === row.key;
            return (
              <BrandRow
                key={row.key}
                row={row}
                isExpanded={isExpanded}
                onToggle={() => toggleExpand(row.key)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HeaderCell({
  label,
  col,
  onSort,
  right,
  children,
}: {
  label: string;
  col: SortKey;
  onSort: (key: SortKey) => void;
  right?: boolean;
  children: React.ReactNode;
}) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors",
        right ? "text-right" : "text-left"
      )}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center">
        {label}
        {children}
      </span>
    </th>
  );
}

function BrandRow({
  row,
  isExpanded,
  onToggle,
}: {
  row: ReturnType<typeof getBrandMetrics>;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={cn(
          "border-b hover:bg-slate-50 cursor-pointer transition-colors",
          isExpanded && "bg-slate-50"
        )}
        onClick={onToggle}
      >
        <td className="px-2 py-2.5 text-center text-slate-400">
          {isExpanded
            ? <ChevronDown className="h-4 w-4 inline" />
            : <ChevronRight className="h-4 w-4 inline" />
          }
        </td>
        <td className="px-3 py-2.5 font-medium">
          <Link
            href={`/brand/${row.key}`}
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.name}
          </Link>
        </td>
        <HighlightableCell cellKey={`${row.key}:_total:spend`} className="px-3 py-2.5 text-right tabular-nums">
          {row.spend > 0 ? formatCurrency(row.spend) : "-"}
        </HighlightableCell>
        <HighlightableCell cellKey={`${row.key}:_total:sales`} className="px-3 py-2.5 text-right tabular-nums">
          {row.ad_sales > 0 ? formatCurrency(row.ad_sales) : "-"}
        </HighlightableCell>
        <HighlightableCell cellKey={`${row.key}:_total:roas`} className="px-3 py-2.5 text-right tabular-nums">
          {row.roas > 0 ? formatRoas(row.roas) : "-"}
        </HighlightableCell>
        <HighlightableCell cellKey={`${row.key}:total_sales:value`} className="px-3 py-2.5 text-right tabular-nums">
          {row.total_sales > 0 ? formatCurrency(row.total_sales) : "-"}
        </HighlightableCell>
        <HighlightableCell cellKey={`${row.key}:total_sales:troas`} className="px-3 py-2.5 text-right tabular-nums">
          {row.troas > 0 ? formatRoas(row.troas) : "-"}
        </HighlightableCell>
        <HighlightableCell cellKey={`${row.key}:spend_vs_sales:value`} className="px-3 py-2.5 text-right tabular-nums">
          {row.spend_vs_sales > 0 ? formatPercent(row.spend_vs_sales) : "-"}
        </HighlightableCell>
      </tr>

      {isExpanded && (
        <tr className="border-b">
          <td colSpan={8} className="p-0">
            <ExpandedDetail brand={row} />
          </td>
        </tr>
      )}
    </>
  );
}

function ExpandedDetail({ brand }: { brand: ReturnType<typeof getBrandMetrics> }) {
  const { data } = brand;
  return (
    <div className="bg-slate-50/70 px-8 py-3 border-t border-slate-100">
      <table className="text-xs w-full max-w-2xl border-collapse">
        <thead>
          <tr className="text-slate-500">
            <th className="text-left py-1 pr-4 font-medium">Campaign Type</th>
            <th className="text-right py-1 px-3 font-medium">Spend</th>
            <th className="text-right py-1 px-3 font-medium">Ad Sales</th>
            <th className="text-right py-1 px-3 font-medium">ROAS</th>
          </tr>
        </thead>
        <tbody>
          {ROW_LABEL_LIST.map((label) => {
            const d = data.campaigns[label];
            if (!d || (d.spend === 0 && d.sales === 0)) return null;
            return (
              <tr key={label} className="border-t border-slate-200/60">
                <td className="py-1 pr-4 text-slate-600">{label}</td>
                <HighlightableCell cellKey={`${brand.key}:${label}:spend`} className="py-1 px-3 text-right tabular-nums">{formatCurrency(d.spend)}</HighlightableCell>
                <HighlightableCell cellKey={`${brand.key}:${label}:sales`} className="py-1 px-3 text-right tabular-nums">{formatCurrency(d.sales)}</HighlightableCell>
                <HighlightableCell cellKey={`${brand.key}:${label}:roas`} className="py-1 px-3 text-right tabular-nums">{d.roas > 0 ? formatRoas(d.roas) : "-"}</HighlightableCell>
              </tr>
            );
          })}

          {data.bloomifi_spend > 0 && (
            <tr className="border-t border-slate-200/60">
              <td className="py-1 pr-4 text-slate-600">Bloomifi</td>
              <HighlightableCell cellKey={`${brand.key}:Bloomifi:spend`} className="py-1 px-3 text-right tabular-nums">{formatCurrency(data.bloomifi_spend)}</HighlightableCell>
              <td className="py-1 px-3 text-right tabular-nums">-</td>
              <td className="py-1 px-3 text-right tabular-nums">-</td>
            </tr>
          )}

          {data.dsp_spend > 0 && (
            <tr className="border-t border-slate-200/60">
              <td className="py-1 pr-4 text-slate-600">DSP</td>
              <HighlightableCell cellKey={`${brand.key}:DSP:spend`} className="py-1 px-3 text-right tabular-nums">{formatCurrency(data.dsp_spend)}</HighlightableCell>
              <HighlightableCell cellKey={`${brand.key}:DSP:sales`} className="py-1 px-3 text-right tabular-nums">{data.dsp_sales > 0 ? formatCurrency(data.dsp_sales) : "-"}</HighlightableCell>
              <td className="py-1 px-3 text-right tabular-nums">-</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
