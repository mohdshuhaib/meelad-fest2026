import Link from "next/link";
import { Download, Search, MessageCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { DISTRICTS } from "@/lib/constants";
import { titleCase } from "@/lib/program-status";
const PAGE_SIZE = 20;
export default async function Participants({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const page = Math.max(1, Number(p.page) || 1);
  const db = createAdminClient();
  let q = db
    .from("participants")
    .select(
      "id,registration_id,name,place,district,date_of_birth,age_at_registration,gender,category,whatsapp_number,group_id,groups(name),participant_programs(id)",
      { count: "exact" },
    )
    .eq("is_active", true)
    .is("deleted_at", null);
  const search = p.q?.replace(/[%,]/g, "");
  if (search)
    q = q.or(`name.ilike.%${search}%,registration_id.ilike.%${search}%`);
  if (p.district) q = q.eq("district", p.district);
  if (p.category) q = q.eq("category", p.category);
  if (p.gender) q = q.eq("gender", p.gender);
  if (p.assignment === "assigned") q = q.not("group_id", "is", null);
  if (p.assignment === "unassigned") q = q.is("group_id", null);
  const { data = [], count = 0 } = await q
    .order("registered_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const male = data?.filter((x) => x.gender === "male").length ?? 0;
  const female = (data?.length ?? 0) - male;
  const params = new URLSearchParams(
    Object.entries(p).filter((e): e is [string, string] => Boolean(e[1])),
  );
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.22em] text-gold">
        Registration directory
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold">Participants</h1>
          <p className="mt-2 text-sm text-muted">
            Search, filter and manage registered festival participants.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/admin/exports/participants?${params}`} className="flex min-h-11 items-center gap-2 rounded-full border border-emerald px-4 text-sm font-bold text-emerald"><Download size={17}/>CSV</a>
          <a href={`/api/admin/exports/participants-xlsx?${params}`} className="flex min-h-11 items-center gap-2 rounded-full border border-emerald px-4 text-sm font-bold text-emerald"><Download size={17}/>Excel</a>
          <a href={`/api/admin/exports/participants-pdf?${params}`} className="flex min-h-11 items-center gap-2 rounded-full border border-emerald px-4 text-sm font-bold text-emerald"><Download size={17}/>PDF</a>
        </div>
      </div>
      <form className="mt-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-5">
        <label className="relative sm:col-span-2">
          <Search className="absolute left-3 top-3.5 text-muted" size={17} />
          <input
            name="q"
            defaultValue={p.q}
            placeholder="Name or Registration ID"
            className="h-11 w-full rounded-xl border border-ink/12 pl-10 pr-3"
          />
        </label>
        <select
          name="district"
          defaultValue={p.district ?? ""}
          className="h-11 rounded-xl border border-ink/12 px-3 text-sm"
        >
          <option value="">All districts</option>
          {DISTRICTS.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <Select
          name="category"
          value={p.category}
          options={["junior", "senior", "super_senior"]}
        />
        <Select name="gender" value={p.gender} options={["male", "female"]} />
        <Select
          name="assignment"
          value={p.assignment}
          options={["assigned", "unassigned"]}
        />
        <button className="min-h-11 rounded-xl bg-emerald text-sm font-bold text-white sm:col-start-5">
          Apply filters
        </button>
      </form>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Stat label="Filtered total" value={count ?? 0} />
        <Stat label="Male on page" value={male} />
        <Stat label="Female on page" value={female} />
      </div>
      <div className="mt-5 space-y-3">
        {data?.map((person, index) => {
          const group = Array.isArray(person.groups)
            ? person.groups[0]
            : person.groups;
          return (
            <article
              key={person.id}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-muted">
                  {(page - 1) * PAGE_SIZE + index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold tracking-wider text-gold">
                    {person.registration_id}
                  </p>
                  <h2 className="truncate font-serif text-xl font-semibold">
                    {person.name}
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    {person.place}, {person.district}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      person.gender,
                      person.category,
                      group?.name ?? "UNASSIGNED",
                      `${person.participant_programs.length} PROGRAMMES`,
                    ].map((v: string) => (
                      <span
                        key={v}
                        className="rounded-full bg-cream px-3 py-1 text-[10px] font-bold uppercase"
                      >
                        {titleCase(v)}
                      </span>
                    ))}
                  </div>
                </div>
                <a
                  href={`https://wa.me/91${person.whatsapp_number}?text=${encodeURIComponent(`ASSALAMU ALAIKUM. THIS IS THE AHLU SAADA MEELAD FEST ORGANISING TEAM REGARDING REGISTRATION ${person.registration_id}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1fa855] text-white"
                  aria-label={`Message ${person.name}`}
                >
                  <MessageCircle size={18} />
                </a>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-ink/7 pt-4 text-xs">
                <span>
                  <b className="block text-muted">DOB</b>
                  {person.date_of_birth}
                </span>
                <span>
                  <b className="block text-muted">Age at registration</b>
                  {person.age_at_registration}
                </span>
              </div>
              <Link href={`/admin/participants/${person.id}`} className="mt-4 inline-block text-sm font-bold text-emerald">View full details and security actions</Link>
            </article>
          );
        })}
        {!data?.length && (
          <p className="rounded-2xl border border-dashed p-10 text-center text-muted">
            No participants match the current filters.
          </p>
        )}
      </div>
      <div className="mt-6 flex justify-between">
        {page > 1 ? (
          <Link
            href={`?${updated(params, "page", String(page - 1))}`}
            className="font-bold text-emerald"
          >
            Previous
          </Link>
        ) : (
          <span />
        )}
        {page * PAGE_SIZE < (count ?? 0) && (
          <Link
            href={`?${updated(params, "page", String(page + 1))}`}
            className="font-bold text-emerald"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
function Select({
  name,
  value,
  options,
}: {
  name: string;
  value?: string;
  options: string[];
}) {
  return (
    <select
      name={name}
      defaultValue={value ?? ""}
      className="h-11 rounded-xl border border-ink/12 px-3 text-sm"
    >
      <option value="">All {name}</option>
      {options.map((x) => (
        <option key={x} value={x}>
          {titleCase(x)}
        </option>
      ))}
    </select>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <b className="text-xl">{value}</b>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
function updated(p: URLSearchParams, k: string, v: string) {
  const n = new URLSearchParams(p);
  n.set(k, v);
  return n.toString();
}
