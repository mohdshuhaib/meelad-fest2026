import { requireCoordinator } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { visibleStatus, titleCase } from "@/lib/program-status";
import { CoordinatorVerify } from "./verify";

function whatsappUrl(number: string, name: string, registrationId: string) {
  const text = encodeURIComponent(
    `ASSALAMU ALAIKUM ${name}. I AM YOUR AHLU SAADA MEELAD FEST COORDINATOR. REGISTRATION ID: ${registrationId}.`,
  );
  return `https://wa.me/91${number}?text=${text}`;
}

export default async function Details({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    gender?: string;
    category?: string;
    status?: string;
  }>;
}) {
  const filters = await searchParams;
  const { profile } = await requireCoordinator();
  const db = createAdminClient();
  const { data: group } = await db
    .from("groups")
    .select("id,name")
    .eq("primary_coordinator_id", profile.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!group) return <p>No assigned group.</p>;
  let q = db
    .from("participants")
    .select(
      "id,registration_id,name,gender,category,whatsapp_number,participant_programs(id,participant_progress_status,verification_status,claimed_submitted_at,rejection_reason,programs(code,name))",
    )
    .eq("group_id", group.id)
    .eq("is_active", true)
    .is("deleted_at", null);
  if (filters.q)
    q = q.or(
      `name.ilike.%${filters.q.replace(/[%,]/g, "")}%,registration_id.ilike.%${filters.q.replace(/[%,]/g, "")}%`,
    );
  if (filters.gender) q = q.eq("gender", filters.gender);
  if (filters.category) q = q.eq("category", filters.category);
  const { data = [] } = await q.order("name").limit(100);
  const people = (data ?? []).filter(
    (p) =>
      !filters.status ||
      p.participant_programs.some(
        (s) =>
          s.verification_status === filters.status ||
          s.participant_progress_status === filters.status,
      ),
  );
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.2em] text-gold">
        {group.name}
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold">
        Participant details
      </h1>
      <form className="mt-6 grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-4">
        <input
          name="q"
          defaultValue={filters.q}
          placeholder="Name or Registration ID"
          className="h-11 rounded-xl border px-3"
        />
        <Select name="gender" value={filters.gender} values={["male", "female"]} />
        <Select
          name="category"
          value={filters.category}
          values={["junior", "senior", "super_senior"]}
        />
        <Select
          name="status"
          value={filters.status}
          values={[
            "pending_verification",
            "verified",
            "rejected",
            "resubmission_required",
            "ongoing",
          ]}
        />
        <button className="rounded-xl bg-emerald py-3 text-sm font-bold text-white sm:col-start-4">
          Apply filters
        </button>
      </form>
      <div className="mt-5 space-y-3">
        {people.map((p, i) => (
          <details key={p.id} className="rounded-2xl bg-white shadow-sm">
            <summary className="cursor-pointer list-none p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold text-gold">
                    {i + 1} · {p.registration_id}
                  </p>
                  <h2 className="font-serif text-xl">{p.name}</h2>
                  <p className="text-xs text-muted">
                    {titleCase(p.gender)} · {titleCase(p.category)} ·{" "}
                    {p.participant_programs.length} programmes
                  </p>
                </div>
                <a
                  href={whatsappUrl(p.whatsapp_number, p.name, p.registration_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#1fa855] px-4 text-xs font-bold text-white"
                >
                  WhatsApp message
                </a>
              </div>
            </summary>
            <div className="border-t p-5">
              <a
                href={whatsappUrl(p.whatsapp_number, p.name, p.registration_id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-emerald px-4 text-sm font-bold text-emerald"
              >
                Contact participant directly
              </a>
              <div className="mt-4 space-y-3">
                {p.participant_programs.map((s) => {
                  const pr = Array.isArray(s.programs)
                    ? s.programs[0]
                    : s.programs;
                  return (
                    <div key={s.id} className="rounded-xl bg-cream p-4">
                      <p className="text-xs font-bold text-gold">{pr?.code}</p>
                      <b>{pr?.name}</b>
                      <p className="mt-1 text-xs">
                        {visibleStatus(
                          s.participant_progress_status,
                          s.verification_status,
                        )}
                      </p>
                      {s.verification_status === "pending_verification" && (
                        <CoordinatorVerify id={s.id} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </details>
        ))}
        {!people.length && (
          <p className="rounded-xl border border-dashed p-8 text-center text-muted">
            No participants match these filters.
          </p>
        )}
      </div>
    </div>
  );
}

function Select({
  name,
  value,
  values,
}: {
  name: string;
  value?: string;
  values: string[];
}) {
  return (
    <select name={name} defaultValue={value ?? ""} className="h-11 rounded-xl border px-3">
      <option value="">All {name}</option>
      {values.map((v) => (
        <option key={v} value={v}>
          {titleCase(v)}
        </option>
      ))}
    </select>
  );
}
