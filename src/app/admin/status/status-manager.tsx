"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  LoaderCircle,
  CheckCheck,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";
import { titleCase, visibleStatus } from "@/lib/program-status";

export type SubmissionRow = {
  id: string;
  participant_progress_status: string;
  verification_status: string;
  claimed_submitted_at: string | null;
  rejection_reason: string | null;
  admin_note: string | null;
  swalath_total?: number | null;
  participant: {
    registration_id: string;
    name: string;
    gender: string;
    category: string;
    district: string;
    whatsapp_number: string;
    group_name: string;
  } | null;
  program: {
    code: string;
    name: string;
    is_swalath_campaign?: boolean;
  } | null;
};

interface StatusManagerProps {
  initialItems: SubmissionRow[];
  totalPendingCount: number;
  currentFilter: string;
  searchQuery: string;
}

export function StatusManager({
  initialItems,
  totalPendingCount,
  currentFilter,
  searchQuery,
}: StatusManagerProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [globalModalOpen, setGlobalModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState<{ action: "verified" | "rejected"; count: number } | null>(null);
  const [bulkReason, setBulkReason] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Per-row states for detailed single action
  const [rowActions, setRowActions] = useState<Record<string, { status: string; reason: string }>>({});

  const isAllSelected =
    initialItems.length > 0 &&
    initialItems.every((item) => selectedIds.has(item.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(initialItems.map((item) => item.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Single Item Update
  const handleSingleUpdate = async (id: string, verificationStatus: string, reason = "") => {
    setPendingAction(`single-${id}`);
    try {
      const res = await fetch(`/api/admin/status/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ verificationStatus, reason }),
      });
      const data = await res.json();
      setPendingAction(null);
      if (!res.ok) {
        showToast("error", data.message || "Failed to update submission.");
        return;
      }
      showToast("success", `Submission updated to '${verificationStatus}'.`);
      // Remove from selectedIds if it was selected
      if (selectedIds.has(id)) {
        const next = new Set(selectedIds);
        next.delete(id);
        setSelectedIds(next);
      }
      router.refresh();
    } catch {
      setPendingAction(null);
      showToast("error", "Network error occurred.");
    }
  };

  // Bulk Selected Update
  const handleBulkUpdate = async (verificationStatus: "verified" | "rejected", reason = "") => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setPendingAction("bulk");
    try {
      const res = await fetch("/api/admin/status/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ids,
          verificationStatus,
          reason,
        }),
      });
      const data = await res.json();
      setPendingAction(null);
      setBulkModalOpen(null);
      setBulkReason("");
      if (!res.ok) {
        showToast("error", data.message || "Bulk update failed.");
        return;
      }
      showToast("success", data.message || `Updated ${ids.length} submissions.`);
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      setPendingAction(null);
      showToast("error", "Network error occurred.");
    }
  };

  // Global Verify All Pending Update
  const handleGlobalVerifyAll = async () => {
    setPendingAction("global-all");
    try {
      const res = await fetch("/api/admin/status/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          allPending: true,
          verificationStatus: "verified",
        }),
      });
      const data = await res.json();
      setPendingAction(null);
      setGlobalModalOpen(false);
      if (!res.ok) {
        showToast("error", data.message || "Global verification failed.");
        return;
      }
      showToast("success", data.message || `All pending submissions verified!`);
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      setPendingAction(null);
      showToast("error", "Network error occurred.");
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold text-white shadow-2xl transition-all ${
            toast.type === "success" ? "bg-emerald" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          {toast.message}
        </div>
      )}

      {/* Global Actions Header & Filter Bar */}
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink">
              Submissions Queue
            </h2>
            <p className="text-xs font-semibold text-muted sm:text-sm">
              Review and verify programme entries individually or in bulk.
            </p>
          </div>

          {/* GLOBAL VERIFY ALL BUTTON */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setGlobalModalOpen(true)}
              disabled={totalPendingCount === 0 || pendingAction !== null}
              className="flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald to-[#063d35] px-6 text-sm font-bold text-white shadow-md shadow-emerald/20 transition-all hover:opacity-95 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck size={19} className="text-gold" />
              <span>Verify All Pending</span>
              <span className="ml-1 rounded-full bg-gold px-2 py-0.5 text-[11px] font-black text-emerald">
                {totalPendingCount}
              </span>
            </button>
          </div>
        </div>

        {/* Search and Queue Filter Form */}
        <form className="grid gap-3 pt-3 border-t border-ink/5 sm:grid-cols-[1fr_240px_auto]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input
              name="q"
              defaultValue={searchQuery}
              placeholder="Search by participant name, registration ID..."
              className="h-11 w-full rounded-xl border border-ink/15 pl-10 pr-3 text-sm font-semibold outline-none focus:border-emerald"
            />
          </div>
          <select
            name="verification"
            defaultValue={currentFilter}
            className="h-11 rounded-xl border border-ink/15 px-3 text-sm font-semibold outline-none focus:border-emerald"
          >
            <option value="pending_verification">Pending Verification ({totalPendingCount})</option>
            <option value="verified">Verified Submissions</option>
            <option value="rejected">Rejected Submissions</option>
            <option value="resubmission_required">Resubmission Required</option>
          </select>
          <button className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald px-6 text-sm font-bold text-white transition-opacity hover:opacity-90">
            <Filter size={16} /> Filter Queue
          </button>
        </form>
      </div>

      {/* Bulk Action Bar (Visible when items are selected) */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#082f2a] p-4 text-white shadow-2xl ring-2 ring-gold/40">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gold/20 font-serif text-sm font-black text-gold">
              {selectedIds.size}
            </span>
            <div>
              <p className="text-sm font-bold text-white">
                {selectedIds.size} submission{selectedIds.size > 1 ? "s" : ""} selected
              </p>
              <p className="text-[11px] font-medium text-emerald-200/70">
                Choose a bulk action to apply to all selected items
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkUpdate("verified")}
              disabled={pendingAction !== null}
              className="flex min-h-10 items-center gap-2 rounded-xl bg-gold px-4 text-xs font-bold text-emerald shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {pendingAction === "bulk" ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <CheckCheck size={15} />
              )}
              Verify Selected ({selectedIds.size})
            </button>

            <button
              onClick={() => setBulkModalOpen({ action: "rejected", count: selectedIds.size })}
              disabled={pendingAction !== null}
              className="flex min-h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <XCircle size={15} />
              Reject Selected
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold text-white/80 hover:bg-white/10"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Submissions List Header with Select All */}
      {initialItems.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <label className="flex items-center gap-2.5 text-xs font-bold text-ink cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="size-4 accent-emerald rounded"
            />
            <span>Select All Visible ({initialItems.length})</span>
          </label>

          <span className="text-xs font-bold text-muted">
            Showing {initialItems.length} items in queue
          </span>
        </div>
      )}

      {/* Submissions List */}
      <div className="space-y-3">
        {initialItems.map((row) => {
          const isSelected = selectedIds.has(row.id);
          const isPendingItem = row.verification_status === "pending_verification";
          const isVerifiedItem = row.verification_status === "verified";
          const isSwalath = row.program?.is_swalath_campaign;
          const rowState = rowActions[row.id] || { status: "verified", reason: "" };

          return (
            <article
              key={row.id}
              className={`rounded-2xl bg-white p-5 shadow-sm transition-all ${
                isSelected ? "ring-2 ring-emerald bg-emerald/5" : "border border-ink/5"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  {/* Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(row.id)}
                    className="mt-1 size-4 accent-emerald rounded cursor-pointer"
                  />

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-bold tracking-wider text-gold">
                        {row.participant?.registration_id} · {row.program?.code}
                      </p>
                      {isSwalath && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[9px] font-black uppercase text-emerald">
                          <Sparkles size={10} /> Swalath Campaign
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 font-serif text-xl font-bold text-ink">
                      {row.participant?.name}
                    </h3>
                    <p className="text-sm font-semibold text-muted">
                      {row.program?.name}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      <span>📍 {row.participant?.district}</span>
                      <span>👥 Group: {row.participant?.group_name || "Unassigned"}</span>
                      <span>👤 {titleCase(row.participant?.gender || "")} · {titleCase(row.participant?.category || "")}</span>
                      {row.claimed_submitted_at && (
                        <span>
                          🕒 {new Intl.DateTimeFormat("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: "Asia/Kolkata",
                          }).format(new Date(row.claimed_submitted_at))} IST
                        </span>
                      )}
                    </div>

                    {isSwalath && row.swalath_total !== undefined && row.swalath_total !== null && row.swalath_total > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald/10 px-2.5 py-1 text-xs font-black text-emerald">
                        ✨ Total Swalath Logged: {row.swalath_total.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge & Single Quick Verify Button */}
                <div className="flex flex-wrap items-center gap-2 self-start">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                      isVerifiedItem
                        ? "bg-emerald/15 text-emerald border border-emerald/20"
                        : isPendingItem
                        ? "bg-amber-100 text-amber-900 border border-amber-200"
                        : "bg-cream text-muted"
                    }`}
                  >
                    {titleCase(row.verification_status)}
                  </span>

                  {/* QUICK 1-CLICK VERIFY BUTTON */}
                  {row.verification_status !== "verified" && (
                    <button
                      onClick={() => handleSingleUpdate(row.id, "verified")}
                      disabled={pendingAction !== null}
                      className="flex min-h-9 items-center gap-1.5 rounded-xl bg-emerald px-3.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      {pendingAction === `single-${row.id}` ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <ShieldCheck size={14} />
                      )}
                      Quick Verify
                    </button>
                  )}
                </div>
              </div>

              {/* Single Item Full Detail Form & Custom Action */}
              <details className="mt-4 border-t border-ink/5 pt-3 group">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-muted hover:text-ink">
                  <span>Detailed Review &amp; Edit Options</span>
                  <ChevronDown size={15} className="transition-transform group-open:rotate-180" />
                </summary>

                <div className="mt-3 rounded-2xl bg-cream/40 p-4">
                  {row.rejection_reason && (
                    <p className="mb-3 rounded-xl bg-red-50 p-2.5 text-xs font-semibold text-red-800">
                      <b>Rejection/Note:</b> {row.rejection_reason}
                    </p>
                  )}
                  {row.admin_note && (
                    <p className="mb-3 rounded-xl bg-emerald/10 p-2.5 text-xs font-semibold text-emerald">
                      <b>Admin Note:</b> {row.admin_note}
                    </p>
                  )}

                  <div className="grid gap-3 sm:grid-cols-[200px_1fr_auto]">
                    <select
                      value={rowState.status}
                      onChange={(e) =>
                        setRowActions((prev) => ({
                          ...prev,
                          [row.id]: { ...rowState, status: e.target.value },
                        }))
                      }
                      className="h-10 rounded-xl border border-ink/15 bg-white px-3 text-xs font-bold"
                    >
                      <option value="verified">Verify Submission</option>
                      <option value="rejected">Reject Submission</option>
                      <option value="resubmission_required">Request Resubmission</option>
                    </select>

                    <input
                      value={rowState.reason}
                      onChange={(e) =>
                        setRowActions((prev) => ({
                          ...prev,
                          [row.id]: { ...rowState, reason: e.target.value },
                        }))
                      }
                      placeholder={
                        rowState.status === "verified"
                          ? "Optional admin note"
                          : "Reason required (min 5 characters)"
                      }
                      className="h-10 rounded-xl border border-ink/15 bg-white px-3 text-xs font-medium"
                    />

                    <button
                      onClick={() => handleSingleUpdate(row.id, rowState.status, rowState.reason)}
                      disabled={
                        pendingAction !== null ||
                        (rowState.status === row.verification_status && !rowState.reason)
                      }
                      className="min-h-10 rounded-xl bg-emerald px-5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      {pendingAction === `single-${row.id}` ? (
                        <LoaderCircle size={15} className="animate-spin mx-auto" />
                      ) : (
                        "Save Result"
                      )}
                    </button>
                  </div>
                </div>
              </details>
            </article>
          );
        })}

        {!initialItems.length && (
          <div className="rounded-3xl border border-dashed border-ink/20 bg-white p-12 text-center text-sm font-medium text-muted">
            No submissions found matching this queue or search filter.
          </div>
        )}
      </div>

      {/* GLOBAL VERIFY ALL CONFIRMATION MODAL */}
      {globalModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald/10 text-emerald mb-4">
              <ShieldCheck size={28} />
            </div>
            <h3 className="font-serif text-2xl font-bold text-ink">
              Verify All Pending Submissions?
            </h3>
            <p className="mt-2 text-sm text-muted">
              Are you sure you want to mark all <b>{totalPendingCount}</b> pending submissions across the entire festival as <b>Verified</b>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setGlobalModalOpen(false)}
                disabled={pendingAction !== null}
                className="rounded-full border border-ink/15 px-5 py-2.5 text-xs font-bold text-ink hover:bg-cream"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGlobalVerifyAll}
                disabled={pendingAction !== null}
                className="flex items-center gap-2 rounded-full bg-emerald px-6 py-2.5 text-xs font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {pendingAction === "global-all" && <LoaderCircle size={15} className="animate-spin" />}
                Yes, Verify All ({totalPendingCount})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK REJECT CONFIRMATION MODAL */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4">
              <XCircle size={28} />
            </div>
            <h3 className="font-serif text-2xl font-bold text-ink">
              Reject Selected Submissions
            </h3>
            <p className="mt-2 text-sm text-muted">
              Enter a rejection reason that will be saved for all <b>{bulkModalOpen.count}</b> selected submissions:
            </p>
            <textarea
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              placeholder="Reason for rejection (required, at least 5 chars)..."
              className="mt-4 min-h-24 w-full rounded-xl border border-ink/20 p-3 text-sm font-medium outline-none focus:border-red-600"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setBulkModalOpen(null);
                  setBulkReason("");
                }}
                disabled={pendingAction !== null}
                className="rounded-full border border-ink/15 px-5 py-2.5 text-xs font-bold text-ink hover:bg-cream"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdate("rejected", bulkReason)}
                disabled={pendingAction !== null || bulkReason.trim().length < 5}
                className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {pendingAction === "bulk" && <LoaderCircle size={15} className="animate-spin" />}
                Reject {bulkModalOpen.count} Submissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
