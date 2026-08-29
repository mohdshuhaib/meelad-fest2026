import Link from "next/link";
import { ChevronDown, Download, MapPin, ArrowRight, Sparkles, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { requireParticipant } from "@/lib/participant-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAgeAndCategory } from "@/lib/registration";
import { titleCase, visibleStatus } from "@/lib/program-status";
import { isSwalathProgram, formatDateDMY } from "@/lib/program-rules";

// Force dynamic rendering with 0 revalidation so participant data and programme statuses are always live
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ParticipantHome() {
  const p = await requireParticipant();
  const db = createAdminClient();

  const { data: selections = [] } = await db
    .from("participant_programs")
    .select("*, programs(code, name, global_status, is_swalath_campaign, campaign_start_date, campaign_end_date)")
    .eq("participant_id", p.id)
    .order("selected_at");

  const submitted = selections?.filter((s) => s.participant_progress_status === "claimed_submitted").length ?? 0;
  const verified = selections?.filter((s) => s.verification_status === "verified").length ?? 0;
  const pending = selections?.filter((s) => s.verification_status === "pending_verification").length ?? 0;
  const currentAge = getAgeAndCategory(p.date_of_birth).age;
  const group = Array.isArray(p.groups) ? p.groups[0] : p.groups;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.22em] text-gold">
        Participant dashboard
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
        WELCOME, {p.gender === "male" ? "MR." : "MS."} {p.name}
      </h1>

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge text={p.registration_id} />
        <Badge text={titleCase(p.category)} />
        <Badge text={group?.name ?? "GROUP NOT ASSIGNED"} />
      </div>

      <details className="group mt-6 rounded-2xl border border-ink/8 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between p-5 font-bold">
          Profile details
          <ChevronDown className="transition group-open:rotate-180" size={18} />
        </summary>
        <dl className="grid gap-x-8 gap-y-4 border-t border-ink/8 p-5 text-sm sm:grid-cols-2">
          {[
            ["Place", `${p.place}, ${p.district}`],
            [
              "Date of birth",
              new Intl.DateTimeFormat("en-IN", {
                dateStyle: "long",
                timeZone: "Asia/Kolkata",
              }).format(new Date(`${p.date_of_birth}T00:00:00+05:30`)),
            ],
            ["Current age", String(currentAge)],
            ["Age at registration", String(p.age_at_registration)],
            ["Gender", titleCase(p.gender)],
            ["Phone", p.phone_number],
            ["WhatsApp", p.whatsapp_number],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                {k}
              </dt>
              <dd className="mt-1 font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </details>

      <section className="mt-9">
        <div className="text-center">
          <p className="text-xs font-bold tracking-[.22em] text-gold">
            YOUR PROGRAMS
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">
            Your festival journey
          </h2>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-bold">
            <span>{submitted} OF 4 PROGRAMMES SUBMITTED</span>
            <span>· {verified} VERIFIED</span>
            <span>· {pending} PENDING</span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {selections?.length ? (
            selections.map((s, i) => {
              const pr = Array.isArray(s.programs) ? s.programs[0] : s.programs;
              const globalStatus = pr?.global_status || "not_started";
              const isOngoing = globalStatus === "ongoing";
              const isClosed = globalStatus === "closed";
              const isSwalath = isSwalathProgram(pr);

              return (
                <article
                  key={s.id}
                  className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream font-serif text-sm font-bold text-ink">
                        {i + 1}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-bold tracking-wider text-gold">
                            {pr?.code}
                          </p>
                          {isSwalath && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[9px] font-black uppercase text-emerald">
                              <Sparkles size={10} /> Daily Swalath Campaign
                            </span>
                          )}
                        </div>
                        <h3 className="font-serif text-lg font-bold text-ink sm:text-xl">
                          {pr?.name}
                        </h3>

                        {isSwalath && pr?.campaign_start_date && (
                          <p className="mt-1 text-xs font-semibold text-muted">
                            Campaign: {formatDateDMY(pr.campaign_start_date)} to {formatDateDMY(pr.campaign_end_date || "2026-09-05")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* LIVE PROGRAMME GLOBAL STATUS BADGE */}
                    <div className="flex items-center gap-2 self-start">
                      {isOngoing ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1 text-xs font-bold text-emerald shadow-sm">
                          <span className="size-2 rounded-full bg-emerald animate-ping" />
                          Ongoing
                        </span>
                      ) : isClosed ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          Closed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
                          <Clock size={12} />
                          Not Started
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SUBMISSION STATUS & ACTIONS */}
                  <div className="mt-4 flex flex-col gap-3 border-t border-ink/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold uppercase tracking-wider text-muted">
                        Submission Status:
                      </span>
                      <span
                        className={`font-bold ${
                          s.verification_status === "verified"
                            ? "text-emerald"
                            : s.verification_status === "pending_verification"
                            ? "text-amber-800"
                            : s.verification_status === "resubmission_required"
                            ? "text-red-700"
                            : "text-muted"
                        }`}
                      >
                        {visibleStatus(
                          s.participant_progress_status,
                          s.verification_status
                        )}
                      </span>

                      {isSwalath && s.swalath_total !== undefined && s.swalath_total > 0 && (
                        <span className="rounded-full bg-emerald/10 px-2.5 py-0.5 text-xs font-black text-emerald">
                          ✨ {s.swalath_total.toLocaleString()} Swalath Logged
                        </span>
                      )}
                    </div>

                    {/* ACTION LINK */}
                    <div>
                      {isOngoing ? (
                        <Link
                          href="/participant/submit"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#063d35]"
                        >
                          {s.participant_progress_status === "claimed_submitted"
                            ? isSwalath ? "Update Swalath Log" : "View Submission"
                            : isSwalath ? "Enter Swalath Count" : "Submit Entry"}
                          <ArrowRight size={14} />
                        </Link>
                      ) : (
                        <span className="text-xs font-semibold text-muted">
                          {isClosed
                            ? "Submission is closed"
                            : "Submission starts when programme is ongoing"}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-ink/20 p-8 text-center text-sm text-muted">
              No programmes selected yet.
              <br />
              <Link
                href="/participant/programs"
                className="mt-2 inline-block font-bold text-emerald"
              >
                Browse eligible programmes
              </Link>
            </div>
          )}
        </div>

        <Link
          href="/api/participant/hall-ticket"
          className="mt-8 flex min-h-13 items-center justify-center gap-2 rounded-full bg-emerald px-6 font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
        >
          <Download size={19} />
          Download hall ticket
        </Link>
      </section>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald/15 bg-white px-3 py-1.5 text-xs font-bold text-emerald shadow-sm">
      <MapPin size={12} />
      {text}
    </span>
  );
}
