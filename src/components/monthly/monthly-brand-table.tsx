"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { MonthlyBrandGroup } from "@/lib/types";

interface MonthlyBrandTableProps {
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

type SortKey = "brand" | "spend" | "sales" | "tacos" | "roas";
type SortDir = "asc" | "desc";

interface RowData {
  name: string;
  slug: string | undefined;
  spend: number;
  sales: number;
  tacos: number;
  roas: number;
  breakdownRows: { label: string; spend: number; sales: number; tacos: number; roas: number }[];
}

export function MonthlyBrandTable({ brandGroups }: MonthlyBrandTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("brand");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);

  const rows: RowData[] = brandGroups.map((group) => {
    const totalRow = group.rows[group.rows.length - 1];
    return {
      name: group.display_name,
      slug: BRAND_SLUG_MAP[group.display_name],
      spend: totalRow?.spend ?? 0,
      sales: totalRow?.sales ?? 0,
      tacos: totalRow?.tacos ?? 0,
      roas: totalRow?.roas ?? 0,
      breakdownRows: group.rows.slice(0, -1),
    };
  });

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

  const toggleExpand = (name: string) => {
    setExpandedBrand((prev) => (prev === name ? null : name));
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
            <HeaderCell label="Total Sales" col="sales" onSort={handleSort} right><SortIcon col="sales" /></HeaderCell>
            <HeaderCell label="TACOS" col="tacos" onSort={handleSort} right><SortIcon col="tacos" /></HeaderCell>
            <HeaderCell label="ROAS" col="roas" onSort={handleSort} right><SortIcon col="roas" /></HeaderCell>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const isExpanded = expandedBrand === row.name;
            return (
              <BrandRow
                key={row.name}
                row={row}
                isExpanded={isExpanded}
                onToggle={() => toggleExpand(row.name)}
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
  row: RowData;
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
          {row.slug ? (
            <Link
              href={`/brand/${row.slug}`}
              className="text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {row.name}
            </Link>
          ) : (
            row.name
          )}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums">
          {row.spend > 0 ? formatCurrency(row.spend) : "-"}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums">
          {row.sales > 0 ? formatCurrency(row.sales) : "-"}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums">
          {row.tacos > 0 ? formatPercent(row.tacos) : "-"}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums">
          {row.roas > 0 ? `$${row.roas.toFixed(2)}` : "-"}
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-b">
          <td colSpan={6} className="p-0">
            <ExpandedDetail breakdownRows={row.breakdownRows} />
          </td>
        </tr>
      )}
    </>
  );
}

function ExpandedDetail({
  breakdownRows,
}: {
  breakdownRows: RowData["breakdownRows"];
}) {
  return (
    <div className="bg-slate-50/70 px-8 py-3 border-t border-slate-100">
      <table className="text-xs w-full max-w-2xl border-collapse">
        <thead>
          <tr className="text-slate-500">
            <th className="text-left py-1 pr-4 font-medium">Source</th>
            <th className="text-right py-1 px-3 font-medium">Spend</th>
            <th className="text-right py-1 px-3 font-medium">Sales</th>
            <th className="text-right py-1 px-3 font-medium">TACOS</th>
            <th className="text-right py-1 px-3 font-medium">ROAS</th>
          </tr>
        </thead>
        <tbody>
          {breakdownRows.map((row) => {
            if (row.spend === 0 && row.sales === 0) return null;
            const sourceMatch = row.label.match(/\(([^)]+)\)/);
            const source = sourceMatch ? sourceMatch[1] : row.label;
            return (
              <tr key={row.label} className="border-t border-slate-200/60">
                <td className="py-1 pr-4 text-slate-600">{source}</td>
                <td className="py-1 px-3 text-right tabular-nums">
                  {row.spend > 0 ? formatCurrency(row.spend) : "-"}
                </td>
                <td className="py-1 px-3 text-right tabular-nums">
                  {row.sales > 0 ? formatCurrency(row.sales) : "-"}
                </td>
                <td className="py-1 px-3 text-right tabular-nums">
                  {row.tacos > 0 ? formatPercent(row.tacos) : "-"}
                </td>
                <td className="py-1 px-3 text-right tabular-nums">
                  {row.roas > 0 ? `$${row.roas.toFixed(2)}` : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
