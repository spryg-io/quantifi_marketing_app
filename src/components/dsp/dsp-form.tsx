"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ALL_BRANDS, BRANDS_CONFIG } from "@/lib/constants";

interface DspEntry {
  brand_key: string;
  date: string;
  spend: number;
  sales: number;
}

export function DspForm() {
  const [date, setDate] = useState("");
  const [entries, setEntries] = useState<Record<string, { spend: string; sales: string }>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [history, setHistory] = useState<DspEntry[]>([]);

  // Initialize date on client only to avoid hydration mismatch
  useEffect(() => {
    setDate(format(subDays(new Date(), 1), "yyyy-MM-dd"));
  }, []);

  const fetchEntries = useCallback(async () => {
    if (!date) return;
    try {
      const res = await fetch(`/api/dsp?date=${date}`);
      if (!res.ok) return;
      const data = await res.json();

      const map: Record<string, { spend: string; sales: string }> = {};
      for (const brand of ALL_BRANDS) {
        map[brand] = { spend: "", sales: "" };
      }
      for (const entry of data.entries || []) {
        map[entry.brand_key] = {
          spend: entry.spend > 0 ? String(entry.spend) : "",
          sales: entry.sales > 0 ? String(entry.sales) : "",
        };
      }
      setEntries(map);
    } catch {
      // ignore
    }
  }, [date]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/dsp");
      if (!res.ok) return;
      const data = await res.json();
      setHistory(data.entries || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchHistory();
  }, [fetchEntries, fetchHistory]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const promises = ALL_BRANDS.map((brandKey) => {
        const entry = entries[brandKey];
        const spend = parseFloat(entry?.spend || "0") || 0;
        const sales = parseFloat(entry?.sales || "0") || 0;

        if (spend === 0 && sales === 0) return Promise.resolve();

        return fetch("/api/dsp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand_key: brandKey, date, spend, sales }),
        });
      });

      await Promise.all(promises);
      setMessage({ type: "success", text: "Entries saved successfully" });
      fetchHistory();
    } catch {
      setMessage({ type: "error", text: "Failed to save entries" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brandKey: string, entryDate: string) => {
    try {
      await fetch("/api/dsp", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_key: brandKey, date: entryDate }),
      });
      fetchHistory();
      if (entryDate === date) fetchEntries();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Entry form */}
      <div className="border rounded-lg bg-white p-6">
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium">Date:</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="text-sm w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left px-3 py-2 font-semibold w-48">Brand</th>
                <th className="text-left px-3 py-2 font-semibold w-40">Spend ($)</th>
                <th className="text-left px-3 py-2 font-semibold w-40">Sales ($)</th>
              </tr>
            </thead>
            <tbody>
              {ALL_BRANDS.map((brandKey) => (
                <tr key={brandKey} className="border-b hover:bg-slate-50">
                  <td className="px-3 py-1.5 text-slate-700">
                    {BRANDS_CONFIG[brandKey]?.display_name || brandKey}
                  </td>
                  <td className="px-3 py-1.5">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={entries[brandKey]?.spend || ""}
                      onChange={(e) =>
                        setEntries((prev) => ({
                          ...prev,
                          [brandKey]: { ...prev[brandKey], spend: e.target.value },
                        }))
                      }
                      className="h-8 w-32"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={entries[brandKey]?.sales || ""}
                      onChange={(e) =>
                        setEntries((prev) => ({
                          ...prev,
                          [brandKey]: { ...prev[brandKey], sales: e.target.value },
                        }))
                      }
                      className="h-8 w-32"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Entries"}
          </Button>
          {message && (
            <span
              className={
                message.type === "success" ? "text-green-600 text-sm" : "text-red-600 text-sm"
              }
            >
              {message.text}
            </span>
          )}
        </div>
      </div>

      {/* Historical entries */}
      {history.length > 0 && (
        <div className="border rounded-lg bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">Historical Entries</h3>
          <div className="overflow-x-auto">
            <table className="text-sm w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-3 py-2 font-semibold">Date</th>
                  <th className="text-left px-3 py-2 font-semibold">Brand</th>
                  <th className="text-right px-3 py-2 font-semibold">Spend</th>
                  <th className="text-right px-3 py-2 font-semibold">Sales</th>
                  <th className="px-3 py-2 w-20" />
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={`${entry.brand_key}-${entry.date}`} className="border-b hover:bg-slate-50">
                    <td className="px-3 py-1.5">{entry.date}</td>
                    <td className="px-3 py-1.5">
                      {BRANDS_CONFIG[entry.brand_key]?.display_name || entry.brand_key}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">${entry.spend.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">${entry.sales.toFixed(2)}</td>
                    <td className="px-3 py-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 h-7"
                        onClick={() => handleDelete(entry.brand_key, entry.date)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
