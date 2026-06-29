import { requireParticipant } from "@/lib/participant-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProgramSelector } from "./program-selector";

function formatIst(value: string | null | undefined) {
  if (!value) return null;
  return (
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date(value)) + " IST"
  );
}

export default async function Programs() {
  const p = await requireParticipant();
  const admin = createAdminClient();
  const now = new Date();
  const [{ data: programs = [] }, { data: selected = [] }, { data: settings }] =
    await Promise.all([
      admin
        .from("programs")
        .select(
          "id,code,name,description,gender_eligibility,category_eligibility,global_status",
        )
        .or(`gender_eligibility.eq.general,gender_eligibility.eq.${p.gender}`)
        .or(
          `category_eligibility.eq.general,category_eligibility.eq.${p.category}`,
        )
        .order("code"),
      admin
        .from("participant_programs")
        .select(
          "program_id,form_opened_at,participant_progress_status,verification_status",
        )
        .eq("participant_id", p.id),
      admin
        .from("app_settings")
        .select(
          "maximum_programs_per_participant,program_selection_open_at,program_selection_close_at",
        )
        .eq("id", true)
        .single(),
    ]);
  const opensAt = settings?.program_selection_open_at ?? null;
  const closesAt = settings?.program_selection_close_at ?? null;
  const phase =
    opensAt && now < new Date(opensAt)
      ? "before"
      : closesAt && now > new Date(closesAt)
        ? "after"
        : "open";
  const readOnlyMessage =
    phase === "before"
      ? `Programme selection has not opened yet${formatIst(opensAt) ? `. It opens on ${formatIst(opensAt)}.` : "."}`
      : phase === "after"
        ? `Programme selection closed${formatIst(closesAt) ? ` on ${formatIst(closesAt)}` : ""}. Your selections are now read-only.`
        : "";

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.22em] text-gold">
        Programme selection
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold">
        Meelad Fest Programs
      </h1>
      <p className="mt-3 text-sm font-semibold leading-6 text-muted">
        Select or remove programmes only while programme selection is active.
        Only programmes still marked Not Started can be changed.
      </p>
      <div
        className={`mt-5 rounded-2xl border p-4 text-sm font-semibold ${
          phase === "open"
            ? "border-emerald/20 bg-emerald/5 text-emerald"
            : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        {phase === "open" ? (
          <>
            Programme selection is active now.
            {closesAt ? ` It closes on ${formatIst(closesAt)}.` : ""}
          </>
        ) : (
          readOnlyMessage
        )}
      </div>
      <ProgramSelector
        programs={programs ?? []}
        initialSelections={selected ?? []}
        maximum={settings?.maximum_programs_per_participant ?? 4}
        readOnly={phase !== "open"}
        readOnlyMessage={readOnlyMessage}
      />
    </div>
  );
}
