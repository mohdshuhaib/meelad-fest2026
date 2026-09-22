"use client";
import { useState } from "react";
import { ExternalLink, LoaderCircle, BookOpen, AlertCircle, X, Check } from "lucide-react";
import { titleCase, visibleStatus } from "@/lib/program-status";
import { isSwalathProgram, isBookTestProgram, isQuizProgram } from "@/lib/program-rules";
import { SwalathTracker } from "./swalath-tracker";
import { BookReaderModal } from "../book-reader-modal";

type Selection = {
  id: string;
  program_id: string;
  participant_progress_status: string;
  verification_status: string;
  form_opened_at: string | null;
  rejection_reason: string | null;
  swalath_entries?: Record<string, number> | null;
  swalath_total?: number | null;
  program: {
    code: string;
    name: string;
    global_status: string;
    submission_form_url: string | null;
    is_swalath_campaign?: boolean | null;
    campaign_start_date?: string | null;
    campaign_end_date?: string | null;
  } | null;
};

export function SubmissionCard({
  selection: initial,
  participant,
}: {
  selection: Selection;
  participant?: { name: string; registration_id: string };
}) {
  const [s, setS] = useState(initial);
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const isSwalath = isSwalathProgram(s.program);
  const isBookTest = isBookTestProgram(s.program);
  const isQuiz = isQuizProgram(s.program);

  async function handleConfirmRedirect() {
    setPending(true);
    setMessage("");
    try {
      const res = await fetch(
        `/api/participant/submissions/${s.program_id}/open`,
        { method: "POST" },
      );
      const result = await res.json();
      setPending(false);
      if (!res.ok) {
        setMessage(result.message || "Failed to open link.");
        return;
      }

      setS((old) => ({
        ...old,
        form_opened_at: old.form_opened_at ?? new Date().toISOString(),
        participant_progress_status: "ongoing",
      }));

      const targetUrl = result.url;
      setRedirectUrl(targetUrl);

      // Attempt to open in a new window/tab
      const newTab = window.open(targetUrl, "_blank", "noopener,noreferrer");
      if (!newTab || newTab.closed || typeof newTab.closed === "undefined") {
        // If popup was blocked by browser (e.g. iOS Safari popup blocker), redirect in current tab or keep modal open with clickable link
        window.location.href = targetUrl;
      } else {
        // Close modal after successful open
        setShowRedirectModal(false);
      }
    } catch {
      setPending(false);
      setMessage("Network error while trying to open link. Please try again.");
    }
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

  // Can open/re-open form as long as programme is active and not already marked submitted/verified
  const canOpenForm =
    !isSwalath &&
    (isOngoing || needsResubmission) &&
    !awaitingOrVerified;

  // Can claim submitted as long as programme is active and they have opened/interacted with the form
  const canClaim =
    !isSwalath &&
    (isOngoing || needsResubmission) &&
    Boolean(s.form_opened_at) &&
    !awaitingOrVerified;

  return (
    <article className="relative rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wider text-gold">
            {s.program?.code}
          </p>
          <h3 className="mt-1 font-serif text-xl font-semibold">
            {s.program?.name}
          </h3>
          {isBookTest && participant && (
            <div className="mt-2">
              <BookReaderModal
                programCode={s.program?.code || "FS001"}
                programName={s.program?.name || "Book Test"}
                participantName={participant.name}
                registrationId={participant.registration_id}
              />
            </div>
          )}
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

      {/* SWALATH CAMPAIGN IN-APP DAILY TRACKER */}
      {isSwalath ? (
        <SwalathTracker
          programId={s.program_id}
          startDate={s.program?.campaign_start_date}
          endDate={s.program?.campaign_end_date}
          initialEntries={s.swalath_entries}
          initialTotal={s.swalath_total}
          isOngoing={isOngoing || needsResubmission}
          onSaved={(newTotal) => {
            setS((old) => ({
              ...old,
              swalath_total: newTotal,
              participant_progress_status: newTotal > 0 ? "claimed_submitted" : old.participant_progress_status,
              verification_status: newTotal > 0 && old.verification_status !== "verified" ? "pending_verification" : old.verification_status,
            }));
          }}
        />
      ) : (
        <>
          {canOpenForm && (
            <>
              <div className="mt-5 rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900">
                {isQuiz ? (
                  <>
                    CLICK THE BUTTON BELOW TO ATTEND THE ONLINE QUIZ / TEST.
                    AFTER COMPLETING THE QUIZ, RETURN TO THIS DASHBOARD AND MARK THE PROGRAMME AS SUBMITTED.
                  </>
                ) : (
                  <>
                    CLICK THE BUTTON BELOW TO OPEN THE SUBMISSION FORM/LINK.
                    AFTER COMPLETING YOUR ENTRY, RETURN TO THIS DASHBOARD AND MARK THE PROGRAMME AS SUBMITTED.
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  setMessage("");
                  setShowRedirectModal(true);
                }}
                disabled={pending || !s.program?.submission_form_url}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-emerald bg-emerald/5 font-bold text-emerald transition-all hover:bg-emerald hover:text-white disabled:opacity-40"
              >
                <ExternalLink size={18} />
                {s.form_opened_at
                  ? isQuiz
                    ? "Re-open Quiz Website"
                    : "Re-open Submission Form"
                  : isQuiz
                  ? needsResubmission
                    ? "Open quiz website again"
                    : "Attend Quiz / Open Website"
                  : needsResubmission
                  ? "Open resubmission form"
                  : "Open submission form"}
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
              {isQuiz
                ? "The quiz link is hidden because this programme has already been marked as submitted."
                : "The submission form is hidden because this programme has already been marked as submitted."}
            </p>
          )}

          {canClaim && (
            <div className="mt-4 border-t border-ink/8 pt-4">
              <label className="flex items-start gap-3 text-xs font-bold leading-5">
                <input
                  type="checkbox"
                  checked={confirm}
                  onChange={(e) => setConfirm(e.target.checked)}
                  className="mt-1 size-4 accent-emerald cursor-pointer"
                />
                <span className="cursor-pointer">
                  {isQuiz
                    ? "I CONFIRM THAT I HAVE ATTENDED AND COMPLETED THE QUIZ ON THE WEBSITE."
                    : "I CONFIRM THAT I HAVE COMPLETED AND SUBMITTED THE FORM / ENTRY FOR THIS PROGRAMME."}
                </span>
              </label>
              <button
                onClick={claim}
                disabled={!confirm || pending}
                className="mt-3 min-h-11 w-full rounded-full bg-emerald px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald/90 disabled:opacity-40"
              >
                {pending ? (
                  <LoaderCircle className="mx-auto animate-spin" size={18} />
                ) : (
                  "Mark as submitted"
                )}
              </button>
            </div>
          )}
        </>
      )}

      {message && (
        <p role="alert" className="mt-3 text-xs font-semibold text-red-700">
          {message}
        </p>
      )}

      {/* CONFIRMATION REDIRECT MODAL */}
      {showRedirectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => !pending && setShowRedirectModal(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-ink/10 sm:p-7">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gold/20 text-gold">
                  <ExternalLink size={18} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink">
                    {isQuiz ? "Attend Online Quiz" : "Open Submission Link"}
                  </h3>
                  <p className="text-[11px] font-bold text-emerald uppercase">
                    {s.program?.code} - {s.program?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !pending && setShowRedirectModal(false)}
                className="rounded-full p-1.5 text-muted hover:bg-cream hover:text-ink transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-xs font-medium leading-relaxed text-ink/80">
              <p className="font-bold text-ink">
                Are you sure you want to redirect to the external {isQuiz ? "quiz website" : "submission form"}?
              </p>
              <div className="rounded-2xl bg-cream/50 p-4 border border-ink/5 space-y-2 text-[11px] text-muted">
                <p>
                  1. You will be redirected to the {isQuiz ? "official test/quiz portal" : "form"}.
                </p>
                <p>
                  2. After completing your entry, return to your dashboard and check the confirmation box to mark it as submitted.
                </p>
              </div>
            </div>

            {message && (
              <p role="alert" className="mt-3 text-xs font-semibold text-red-600">
                {message}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={pending}
                onClick={() => setShowRedirectModal(false)}
                className="rounded-xl border border-ink/15 px-5 py-2.5 text-xs font-bold text-muted hover:bg-cream hover:text-ink transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleConfirmRedirect}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald/20 hover:bg-emerald/90 transition-all disabled:opacity-50 cursor-pointer"
              >
                {pending ? (
                  <>
                    <LoaderCircle className="animate-spin" size={16} />
                    Opening...
                  </>
                ) : (
                  <>
                    <ExternalLink size={16} />
                    Yes, Continue to Website
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
