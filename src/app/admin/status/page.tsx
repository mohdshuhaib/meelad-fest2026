import { createAdminClient } from "@/lib/supabase/admin";
import { StatusManager, type SubmissionRow } from "./status-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ verification?: string; q?: string }>;
}) {
  const p = await searchParams;
  const db = createAdminClient();

  // Fetch counts for all verification queues in parallel
  const [
    pendingCountRes,
    verifiedCountRes,
    rejectedCountRes,
    resubmitCountRes,
  ] = await Promise.all([
    db
      .from("participant_programs")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "pending_verification"),
    db
      .from("participant_programs")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "verified"),
    db
      .from("participant_programs")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "rejected"),
    db
      .from("participant_programs")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "resubmission_required"),
  ]);

  const totalPendingCount = pendingCountRes.count ?? 0;
  const totalVerifiedCount = verifiedCountRes.count ?? 0;
  const totalRejectedCount = rejectedCountRes.count ?? 0;
  const totalResubmitCount = resubmitCountRes.count ?? 0;

  const currentFilter = p.verification || "pending_verification";

  let query = db
    .from("participant_programs")
    .select(
      "id, participant_progress_status, verification_status, claimed_submitted_at, rejection_reason, admin_note, swalath_total, participants(registration_id, name, gender, category, district, whatsapp_number, groups(name)), programs(code, name, is_swalath_campaign)"
    )
    .order("claimed_submitted_at", { ascending: false, nullsFirst: false })
    .limit(200);

  if (p.verification) {
    query = query.eq("verification_status", p.verification);
  } else {
    query = query.eq("verification_status", "pending_verification");
  }

  const { data = [] } = await query;

  const search = p.q?.toUpperCase().trim();
  const rawItems = data ?? [];

  const formattedItems: SubmissionRow[] = rawItems
    .map((row) => {
      const person = Array.isArray(row.participants)
        ? row.participants[0]
        : row.participants;
      const program = Array.isArray(row.programs)
        ? row.programs[0]
        : row.programs;
      const group = Array.isArray(person?.groups)
        ? person.groups[0]
        : person?.groups;

      return {
        id: row.id,
        participant_progress_status: row.participant_progress_status,
        verification_status: row.verification_status,
        claimed_submitted_at: row.claimed_submitted_at,
        rejection_reason: row.rejection_reason,
        admin_note: row.admin_note,
        swalath_total: row.swalath_total,
        participant: person
          ? {
              registration_id: person.registration_id,
              name: person.name,
              gender: person.gender,
              category: person.category,
              district: person.district,
              whatsapp_number: person.whatsapp_number,
              group_name: group?.name ?? "Unassigned",
            }
          : null,
        program: program
          ? {
              code: program.code,
              name: program.name,
              is_swalath_campaign: program.is_swalath_campaign,
            }
          : null,
      };
    })
    .filter((item) => {
      if (!search) return true;
      const name = item.participant?.name?.toUpperCase() ?? "";
      const regId = item.participant?.registration_id?.toUpperCase() ?? "";
      const progCode = item.program?.code?.toUpperCase() ?? "";
      const progName = item.program?.name?.toUpperCase() ?? "";
      return (
        name.includes(search) ||
        regId.includes(search) ||
        progCode.includes(search) ||
        progName.includes(search)
      );
    });

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.22em] text-gold">
        Festival Evaluation
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold">Submission Status</h1>
          <p className="mt-2 text-sm text-muted">
            Verify Google Form and Swalath entries with single or global bulk actions.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Pending Review
          </p>
          <b className="mt-1 block font-serif text-3xl font-black text-amber-900">
            {totalPendingCount}
          </b>
        </div>

        <div className="rounded-2xl border border-emerald/20 bg-emerald/5 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald">
            Verified
          </p>
          <b className="mt-1 block font-serif text-3xl font-black text-emerald">
            {totalVerifiedCount}
          </b>
        </div>

        <div className="rounded-2xl border border-red-200/60 bg-red-50/50 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-red-700">
            Rejected
          </p>
          <b className="mt-1 block font-serif text-3xl font-black text-red-800">
            {totalRejectedCount}
          </b>
        </div>

        <div className="rounded-2xl border border-purple-200/60 bg-purple-50/50 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-700">
            Resubmit Needed
          </p>
          <b className="mt-1 block font-serif text-3xl font-black text-purple-800">
            {totalResubmitCount}
          </b>
        </div>
      </div>

      <StatusManager
        initialItems={formattedItems}
        totalPendingCount={totalPendingCount}
        currentFilter={currentFilter}
        searchQuery={p.q ?? ""}
      />
    </div>
  );
}
