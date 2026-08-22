"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Save,
  AlertCircle,
} from "lucide-react";
import { generateCampaignDateList, formatDateDMY } from "@/lib/program-rules";

interface SwalathTrackerProps {
  programId: string;
  startDate?: string | null;
  endDate?: string | null;
  initialEntries?: Record<string, number> | null;
  initialTotal?: number | null;
  isOngoing: boolean;
  onSaved?: (newTotal: number) => void;
}

export function SwalathTracker({
  programId,
  startDate = "2026-08-22",
  endDate = "2026-09-05",
  initialEntries = {},
  initialTotal = 0,
  isOngoing,
  onSaved,
}: SwalathTrackerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [entries, setEntries] = useState<Record<string, number | string>>(() => {
    const raw = initialEntries || {};
    const res: Record<string, number | string> = {};
    for (const [k, v] of Object.entries(raw)) {
      res[k] = v;
    }
    return res;
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savedTotal, setSavedTotal] = useState<number>(initialTotal || 0);

  // Generate date list between start and end date
  const dateList = useMemo(() => {
    return generateCampaignDateList(startDate, endDate);
  }, [startDate, endDate]);

  // Dynamically calculate live total from all input fields
  const liveTotal = useMemo(() => {
    let sum = 0;
    for (const d of dateList) {
      const val = entries[d];
      if (val !== undefined && val !== "") {
        const num = Number(val);
        if (!isNaN(num) && num > 0) {
          sum += num;
        }
      }
    }
    return sum;
  }, [entries, dateList]);

  const handleInputChange = (dateStr: string, value: string) => {
    setMessage(null);
    if (value === "") {
      setEntries((prev) => {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      });
      return;
    }

    const cleanNum = Math.max(0, Math.floor(Number(value) || 0));
    setEntries((prev) => ({
      ...prev,
      [dateStr]: cleanNum,
    }));
  };

  const handleSave = async () => {
    if (!isOngoing) return;
    setPending(true);
    setMessage(null);

    // Prepare payload
    const payload: Record<string, number> = {};
    for (const [k, v] of Object.entries(entries)) {
      const num = Number(v);
      if (!isNaN(num) && num > 0) {
        payload[k] = num;
      }
    }

    try {
      const res = await fetch(`/api/participant/submissions/${programId}/swalath`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entries: payload }),
      });

      const data = await res.json();
      setPending(false);

      if (!res.ok) {
        setMessage({ type: "error", text: data.message || "Failed to save swalath counts." });
        return;
      }

      setSavedTotal(data.total || 0);
      setMessage({ type: "success", text: "Swalath counts saved successfully!" });
      if (onSaved) {
        onSaved(data.total || 0);
      }
    } catch {
      setPending(false);
      setMessage({ type: "error", text: "Network error. Please try again." });
    }
  };

  const startFormatted = formatDateDMY(startDate || "2026-08-22");
  const endFormatted = formatDateDMY(endDate || "2026-09-05");

  return (
    <div className="mt-5 rounded-2xl border border-emerald/20 bg-emerald/5 p-4 sm:p-5">
      {/* Dropdown Header with Arrow mark */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 text-left transition-opacity hover:opacity-80"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gold/20 text-gold shadow-sm">
            <Sparkles size={18} />
          </span>
          <div>
            <h4 className="font-serif text-lg font-bold text-ink">
              Daily Swalath Entry Log
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
              <span className="inline-flex items-center gap-1">
                <Calendar size={13} className="text-emerald" />
                {startFormatted} to {endFormatted}
              </span>
              <span>•</span>
              <span className="text-emerald font-bold">
                Total Logged: {savedTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald shadow-sm ring-1 ring-emerald/20">
            {liveTotal.toLocaleString()} Swalath
          </span>
          <div className="flex size-8 items-center justify-center rounded-full bg-white text-ink shadow-sm ring-1 ring-ink/10">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="mt-5 border-t border-emerald/15 pt-5">
          <p className="text-xs font-semibold text-muted">
            Enter the count of Swalath you recited on each date from{" "}
            <b>{startFormatted}</b> to <b>{endFormatted}</b>. The total will be automatically calculated.
          </p>

          {!isOngoing && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-900 ring-1 ring-amber-200">
              <AlertCircle size={16} />
              Daily entry is currently view-only because this programme is not in ongoing status.
            </div>
          )}

          {/* Daily Input Table / Rows */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
            <div className="grid grid-cols-[1.2fr_1fr] border-b border-ink/10 bg-cream/60 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted sm:px-6">
              <span>Date</span>
              <span className="text-right">Swalath Count</span>
            </div>

            <div className="divide-y divide-ink/5 max-h-[380px] overflow-y-auto">
              {dateList.map((dateStr, index) => {
                const dateObj = new Date(`${dateStr}T00:00:00+05:30`);
                const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                const formattedDate = formatDateDMY(dateStr);
                const currentVal = entries[dateStr] ?? "";

                return (
                  <div
                    key={dateStr}
                    className="grid grid-cols-[1.2fr_1fr] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-cream/30 sm:px-6"
                  >
                    {/* Column 1: Date */}
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-6 items-center justify-center rounded-md bg-cream text-[10px] font-bold text-muted">
                        {index + 1}
                      </span>
                      <div>
                        <b className="text-sm font-semibold text-ink">
                          {formattedDate}
                        </b>
                        <span className="ml-1.5 text-xs text-muted font-medium">
                          ({dayName})
                        </span>
                      </div>
                    </div>

                    {/* Column 2: Input Field for Count */}
                    <div className="flex justify-end">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        disabled={!isOngoing || pending}
                        value={currentVal}
                        onChange={(e) => handleInputChange(dateStr, e.target.value)}
                        placeholder="0"
                        className="h-10 w-full max-w-[150px] rounded-xl border border-ink/15 bg-white px-3 text-right text-sm font-bold text-ink shadow-sm outline-none transition-all placeholder:text-muted/50 focus:border-emerald focus:ring-2 focus:ring-emerald/15 disabled:bg-cream/60 disabled:text-muted"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Row */}
            <div className="grid grid-cols-[1.2fr_1fr] items-center border-t-2 border-emerald/20 bg-emerald/10 px-4 py-3 sm:px-6">
              <span className="font-serif text-sm font-extrabold uppercase tracking-wider text-emerald">
                Total Swalath (Auto Calculated)
              </span>
              <div className="text-right">
                <span className="font-serif text-xl font-black text-emerald sm:text-2xl">
                  {liveTotal.toLocaleString()}
                </span>
                <span className="ml-1 text-[11px] font-bold uppercase text-emerald/70">
                  count
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Message */}
          {message && (
            <div
              className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs font-bold ${
                message.type === "success"
                  ? "bg-emerald/15 text-emerald ring-1 ring-emerald/30"
                  : "bg-red-50 text-red-700 ring-1 ring-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {message.text}
            </div>
          )}

          {/* Save Button */}
          {isOngoing && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-medium text-muted">
                Make sure to click &quot;Save Daily Counts&quot; after updating your numbers.
              </p>
              <button
                type="button"
                onClick={handleSave}
                disabled={pending}
                className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald px-6 text-xs font-bold text-white shadow-md transition-all hover:bg-[#063d35] disabled:opacity-50"
              >
                {pending ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                Save Daily Counts
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
