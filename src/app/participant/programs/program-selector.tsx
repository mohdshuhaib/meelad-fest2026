"use client";
import { useState } from "react";
import { Check, LoaderCircle, Plus } from "lucide-react";
import { titleCase } from "@/lib/program-status";
type Program = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  gender_eligibility: string;
  category_eligibility: string;
  global_status: string;
};
type Selection = {
  program_id: string;
  form_opened_at: string | null;
  participant_progress_status: string;
  verification_status: string;
};
export function ProgramSelector({
  programs,
  initialSelections,
  maximum,
  readOnly,
  readOnlyMessage,
}: {
  programs: Program[];
  initialSelections: Selection[];
  maximum: number;
  readOnly: boolean;
  readOnlyMessage?: string;
}) {
  const [selected, setSelected] = useState(
    new Map(initialSelections.map((s) => [s.program_id, s])),
  );
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  async function toggle(id: string) {
    if (readOnly) {
      setError(
        readOnlyMessage ||
          "Programme selection is not active now. Your selections are read-only.",
      );
      return;
    }
    setPending(id);
    setError("");
    const removing = selected.has(id);
    const res = await fetch("/api/participant/programs", {
      method: removing ? "DELETE" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ programId: id }),
    });
    const result = await res.json();
    setPending("");
    if (!res.ok) {
      setError(result.message ?? "The selection could not be changed.");
      return;
    }
    setSelected((old) => {
      const next = new Map(old);
      if (removing) next.delete(id);
      else
        next.set(id, {
          program_id: id,
          form_opened_at: null,
          participant_progress_status: "not_started",
          verification_status: "not_submitted",
        });
      return next;
    });
  }
  return (
    <div className="mt-7">
      <div className="sticky top-2 z-20 mb-4 flex items-center justify-between rounded-2xl bg-emerald px-5 py-4 text-white shadow-lg">
        <span className="text-xs font-bold tracking-wider">
          SELECTED PROGRAMMES
        </span>
        <b>
          {selected.size} OF {maximum}
        </b>
      </div>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}
      <div className="space-y-3">
        {programs.map((program) => {
          const selection = selected.get(program.id);
          const locked = Boolean(
            selection &&
            (selection.form_opened_at ||
              selection.participant_progress_status !== "not_started" ||
              selection.verification_status !== "not_submitted"),
          );
          const active = Boolean(selection);
          const selectionWindow = program.global_status === "not_started";
          return (
            <article
              key={program.id}
              className={`rounded-2xl border p-5 transition ${active ? "border-emerald bg-emerald/5" : "border-ink/10 bg-white"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-wider text-gold">
                    {program.code}
                  </p>
                  <h2 className="mt-1 font-serif text-xl font-semibold">
                    {program.name}
                  </h2>
                </div>
                <button
                  onClick={() => toggle(program.id)}
                  disabled={
                    readOnly ||
                    locked ||
                    pending === program.id ||
                    !selectionWindow ||
                    (!active && selected.size >= maximum)
                  }
                  aria-label={`${active ? "Remove" : "Select"} ${program.name}`}
                  className={`grid size-11 shrink-0 place-items-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-emerald bg-emerald text-white" : "border-ink/15 bg-white text-emerald"}`}
                >
                  {pending === program.id ? (
                    <LoaderCircle className="animate-spin" size={19} />
                  ) : active ? (
                    <Check size={19} />
                  ) : (
                    <Plus size={19} />
                  )}
                </button>
              </div>
              {program.description && (
                <p className="mt-3 text-sm leading-6 text-muted">
                  {program.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ["category", program.category_eligibility],
                  ["gender", program.gender_eligibility],
                  ["status", program.global_status],
                ].map(([field, value]) => (
                  <span
                    key={field}
                    className="rounded-full bg-cream px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-muted"
                  >
                    {titleCase(value)}
                  </span>
                ))}
              </div>
              {locked && (
                <p className="mt-3 text-xs font-semibold text-amber-700">
                  Submission workflow started; this programme can no longer be
                  removed.
                </p>
              )}
              {!selectionWindow && (
                <p className="mt-3 text-xs font-semibold text-muted">
                  Selection changes are locked because this programme is {titleCase(program.global_status)}.
                </p>
              )}
            </article>
          );
        })}
        {!programs.length && (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted">
            No eligible programmes are available yet.
          </p>
        )}
      </div>
    </div>
  );
}
