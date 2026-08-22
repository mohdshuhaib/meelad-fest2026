import { createAdminClient } from "@/lib/supabase/admin";
import { PointSettingsModal } from "./point-settings-modal";
import { GradingPanel } from "./grading-panel";
import { Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; q?: string }>;
}) {
  const { program: selectedProgramId, q: searchQuery } = await searchParams;
  const db = createAdminClient();

  const [programsRes, settingsRes] = await Promise.all([
    db.from("programs").select("id, code, name").order("code"),
    db.from("app_settings").select("point_rules").eq("id", true).single(),
  ]);

  const programs = programsRes.data || [];
  const pointRules = settingsRes.data?.point_rules;

  let participants: any[] = [];
  if (selectedProgramId) {
    let query = db
      .from("participant_programs")
      .select(
        "id, result_grade, result_position, result_points, swalath_total, participants!inner(registration_id, name, district, category)",
      )
      .eq("program_id", selectedProgramId)
      .eq("verification_status", "verified");

    if (searchQuery) {
      query = query.ilike("participants.registration_id", `%${searchQuery}%`);
    }

    const { data } = await query;
    participants = data || [];
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.22em] text-gold">
            Scoring & Awards
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Results</h1>
          <p className="mt-2 text-sm text-muted">
            Select a programme to assign grades and standings to verified submissions.
          </p>
        </div>
        <PointSettingsModal initialRules={pointRules} />
      </div>

      <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 max-w-sm">
            <label className="text-xs font-bold tracking-wider text-muted uppercase">
              Select Programme
            </label>
            <form className="mt-2 flex gap-2">
              <select
                name="program"
                defaultValue={selectedProgramId || ""}
                className="w-full rounded-xl border border-ink/20 bg-transparent px-4 py-3 text-sm font-semibold outline-none focus:border-emerald"
              >
                <option value="" disabled>
                  -- Select a Programme --
                </option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded-xl bg-emerald px-5 font-bold text-white transition-opacity hover:opacity-90">
                Load
              </button>
            </form>
          </div>

          {selectedProgramId && (
            <div className="flex-1 max-w-sm">
              <label className="text-xs font-bold tracking-wider text-muted uppercase">
                Search Participant
              </label>
              <form className="mt-2 relative">
                <input type="hidden" name="program" value={selectedProgramId} />
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery || ""}
                  placeholder="Search by Registration ID..."
                  className="w-full rounded-xl border border-ink/20 bg-transparent pl-11 pr-4 py-3 text-sm font-semibold outline-none focus:border-emerald"
                />
              </form>
            </div>
          )}
        </div>

        {selectedProgramId && (
          <div className="mt-8">
            <h2 className="font-serif text-2xl font-semibold mb-1">
              Participants to Grade
            </h2>
            <p className="text-sm text-muted mb-6">
              Found {participants.length} verified submissions.
            </p>

            <div className="space-y-4">
              {participants.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink/20 p-8 text-center text-sm font-medium text-muted">
                  No participants found. Try adjusting your search or ensure submissions are marked as 'Verified'.
                </div>
              ) : (
                participants.map((pp) => (
                  <GradingPanel key={pp.id} pp={pp} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
