import { createAdminClient } from "@/lib/supabase/admin";
import { ResetButton } from "./reset-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ResetsPage() {
  const db = createAdminClient();
  const { data: stuck } = await db
    .from("participant_programs")
    .select(
      "id, form_opened_at, programs(code, name), participants(registration_id, name)",
    )
    .not("form_opened_at", "is", null)
    .eq("participant_progress_status", "ongoing")
    .order("form_opened_at", { ascending: false });

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.22em] text-gold">
        Troubleshooting
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold">Form Resets</h1>
      <p className="mt-2 text-sm text-muted">
        Participants who have opened a submission form but have not marked it as submitted yet. You can give them another chance to open the form.
      </p>

      <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
        {!stuck?.length ? (
          <p className="text-center text-sm font-medium text-muted">
            No participants are currently stuck.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-wider text-muted">
                  <th className="pb-3 font-bold">Participant</th>
                  <th className="pb-3 font-bold">Programme</th>
                  <th className="pb-3 font-bold">Opened At</th>
                  <th className="pb-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {stuck.map((s) => {
                  const p = Array.isArray(s.participants)
                    ? s.participants[0]
                    : s.participants;
                  const prog = Array.isArray(s.programs)
                    ? s.programs[0]
                    : s.programs;
                  return (
                    <tr key={s.id} className="transition-colors hover:bg-cream/40">
                      <td className="py-4 pr-4">
                        <b className="block">{p?.name}</b>
                        <span className="text-xs text-muted">
                          {p?.registration_id}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <b className="block">{prog?.code}</b>
                        <span className="text-xs text-muted">{prog?.name}</span>
                      </td>
                      <td className="py-4 pr-4 text-xs text-muted whitespace-nowrap">
                        {s.form_opened_at &&
                          new Intl.DateTimeFormat("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: "Asia/Kolkata",
                          }).format(new Date(s.form_opened_at))}
                      </td>
                      <td className="py-4 text-right">
                        <ResetButton id={s.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
