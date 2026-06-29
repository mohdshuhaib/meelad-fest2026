"use client";
import { useState } from "react";
import { ExternalLink, LoaderCircle } from "lucide-react";
import { titleCase, visibleStatus } from "@/lib/program-status";
type Selection = {
  id: string;
  program_id: string;
  participant_progress_status: string;
  verification_status: string;
  form_opened_at: string | null;
  rejection_reason: string | null;
  program: {
    code: string;
    name: string;
    global_status: string;
    submission_form_url: string | null;
  } | null;
};
export function SubmissionCard({
  selection: initial,
}: {
  selection: Selection;
}) {
  const [s, setS] = useState(initial);
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function openForm() {
    setPending(true);
    setMessage("");
    const res = await fetch(
      `/api/participant/submissions/${s.program_id}/open`,
      { method: "POST" },
    );
    const result = await res.json();
    setPending(false);
    if (!res.ok) {
      setMessage(result.message);
      return;
    }
    setS((old) => ({
      ...old,
      form_opened_at: old.form_opened_at ?? new Date().toISOString(),
      participant_progress_status: "ongoing",
    }));
    window.open(result.url, "_blank", "noopener,noreferrer");
  }
  async function claim() {
    setPending(true);
    const res = await fetch(
      `/api/participant/submissions/${s.program_id}/claim`,
      { method: "POST" },
    );
    const result = await res.json();
    setPending(false);
    if (!res.ok) {
      setMessage(result.message);
      return;
    }
    setS((old) => ({
      ...old,
      participant_progress_status: "claimed_submitted",
      verification_status: "pending_verification",
      rejection_reason: null,
    }));
  }
  const isOngoing = s.program?.global_status === "ongoing";
  const needsResubmission = ["rejected", "resubmission_required"].includes(
    s.verification_status,
  );
  const awaitingOrVerified = ["pending_verification", "verified"].includes(
    s.verification_status,
  );
  const canOpenForm =
    (isOngoing || needsResubmission) &&
    !awaitingOrVerified &&
    (s.participant_progress_status !== "claimed_submitted" ||
      needsResubmission);
  const canClaim =
    (isOngoing || needsResubmission) &&
    Boolean(s.form_opened_at) &&
    (!needsResubmission || s.participant_progress_status === "ongoing") &&
    ["not_submitted", "rejected", "resubmission_required"].includes(
      s.verification_status,
    );
  return (
    <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wider text-gold">
            {s.program?.code}
          </p>
          <h3 className="mt-1 font-serif text-xl font-semibold">
            {s.program?.name}
          </h3>
        </div>
        <span className="rounded-full bg-cream px-3 py-1 text-[10px] font-bold uppercase">
          {titleCase(s.program?.global_status ?? "not_started")}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-cream p-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted">
            Progress
          </p>
          <b className="mt-1 block">
            {titleCase(s.participant_progress_status)}
          </b>
        </div>
        <div className="rounded-xl bg-cream p-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted">
            Status
          </p>
          <b className="mt-1 block text-emerald">
            {visibleStatus(
              s.participant_progress_status,
              s.verification_status,
            )}
          </b>
        </div>
      </div>
      {["rejected", "resubmission_required"].includes(
        s.verification_status,
      ) && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <b>{titleCase(s.verification_status)}</b>
          <p className="mt-1">
            {s.rejection_reason ?? "Please update and submit your entry again."}
          </p>
        </div>
      )}
      {canOpenForm && (
        <>
          <div className="mt-5 rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900">
            A GOOGLE ACCOUNT MAY BE REQUIRED TO UPLOAD YOUR PROGRAMME ENTRY.
            AFTER SUBMITTING THE GOOGLE FORM, RETURN TO THIS DASHBOARD AND MARK
            THE PROGRAMME AS SUBMITTED.
          </div>
          <button
            onClick={openForm}
            disabled={pending || !s.program?.submission_form_url}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-emerald font-bold text-emerald disabled:opacity-40"
          >
            {pending ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <ExternalLink size={18} />
            )}
            {needsResubmission ? "Open resubmission form" : "Open submission form"}
          </button>
        </>
      )}
      {!isOngoing && !needsResubmission && (
        <p className="mt-4 rounded-xl bg-cream p-3 text-xs font-semibold text-muted">
          Submission is unavailable because this programme is {titleCase(s.program?.global_status ?? "not_started")}.
        </p>
      )}
      {awaitingOrVerified && (
        <p className="mt-4 rounded-xl bg-emerald/5 p-3 text-xs font-semibold text-emerald">
          The submission form is hidden because this programme has already been submitted.
        </p>
      )}
      {canClaim && (
        <div className="mt-4 border-t border-ink/8 pt-4">
          <label className="flex items-start gap-3 text-xs font-bold leading-5">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="mt-1 accent-emerald"
            />
            I CONFIRM THAT I HAVE COMPLETED AND SUBMITTED THE GOOGLE FORM FOR
            THIS PROGRAMME.
          </label>
          <button
            onClick={claim}
            disabled={!confirm || pending}
            className="mt-3 min-h-11 w-full rounded-full bg-emerald px-4 text-xs font-bold text-white disabled:opacity-40"
          >
            Mark as submitted
          </button>
        </div>
      )}
      {message && (
        <p role="alert" className="mt-3 text-xs font-semibold text-red-700">
          {message}
        </p>
      )}
    </article>
  );
}
