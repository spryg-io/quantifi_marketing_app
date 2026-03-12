"use client";

import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { HighlightableCell } from "@/components/highlights/highlightable-cell";
import type { MonthlyBrandGroup } from "@/lib/types";

interface MonthlyTableProps {
  brandGroups: MonthlyBrandGroup[];
}

export function MonthlyTable({ brandGroups }: MonthlyTableProps) {
  return (
    <div className="overflow-x-auto border rounded-lg bg-white">
      <table className="border-collapse text-sm w-full min-w-[700px]">
        <thead>
          <tr className="bg-slate-600 text-white">
            <th className="px-4 py-2 text-left font-semibold w-64">Brand</th>
            <th className="px-4 py-2 text-right font-semibold">Spend</th>
            <th className="px-4 py-2 text-right font-semibold">Sales</th>
            <th className="px-4 py-2 text-right font-semibold">TACOS</th>
            <th className="px-4 py-2 text-right font-semibold">ROAS</th>
          </tr>
        </thead>
        <tbody>
          {brandGroups.map((group, groupIdx) => (
            <Group key={group.display_name} group={group} index={groupIdx} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Group({ group, index }: { group: MonthlyBrandGroup; index: number }) {
  const bgBase = index % 2 === 0 ? "bg-white" : "bg-slate-50";

  return (
    <>
      {group.rows.map((row, rowIdx) => {
        const isTotal = row.label.includes("(Total)");
        return (
          <tr
            key={row.label}
            className={cn(
              bgBase,
              isTotal && "border-b-2 border-slate-300",
              rowIdx === 0 && "border-t border-slate-200"
            )}
          >
            <td
              className={cn(
                "px-4 py-1.5 text-slate-700",
                isTotal ? "font-bold" : "pl-8"
              )}
            >
              {row.label}
            </td>
            <HighlightableCell
              cellKey={`${group.display_name}:${row.label}:spend`}
              className={cn(
                "px-4 py-1.5 text-right tabular-nums",
                isTotal && "font-bold"
              )}
            >
              {row.spend > 0 ? formatCurrency(row.spend) : "-"}
            </HighlightableCell>
            <HighlightableCell
              cellKey={`${group.display_name}:${row.label}:sales`}
              className={cn(
                "px-4 py-1.5 text-right tabular-nums",
                isTotal && "font-bold"
              )}
            >
              {row.sales > 0 ? formatCurrency(row.sales) : "-"}
            </HighlightableCell>
            <HighlightableCell
              cellKey={`${group.display_name}:${row.label}:tacos`}
              className={cn(
                "px-4 py-1.5 text-right tabular-nums",
                isTotal && "font-bold"
              )}
            >
              {row.tacos > 0 ? formatPercent(row.tacos) : "-"}
            </HighlightableCell>
            <HighlightableCell
              cellKey={`${group.display_name}:${row.label}:roas`}
              className={cn(
                "px-4 py-1.5 text-right tabular-nums",
                isTotal && "font-bold"
              )}
            >
              {row.roas > 0 ? row.roas.toFixed(2) : "-"}
            </HighlightableCell>
          </tr>
        );
      })}
    </>
  );
}
