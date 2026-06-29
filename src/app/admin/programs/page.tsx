import Link from "next/link";
import { Search, Download } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { titleCase } from "@/lib/program-status";
import { ProgramForm } from "./program-form";
import { ProgramEdit } from "./program-edit";
const PAGE_SIZE = 15;
export default async function AdminPrograms({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const page = Math.max(1, Number(p.page) || 1);
  const db = createAdminClient();
  let query = db
    .from("programs")
    .select("*,participant_programs(verification_status)", { count: "exact" });
  if (p.q)
    query = query.or(
      `code.ilike.%${p.q.replace(/[%,]/g, "")}%,name.ilike.%${p.q.replace(/[%,]/g, "")}%`,
    );
  if (p.category) query = query.eq("category_eligibility", p.category);
  if (p.gender) query = query.eq("gender_eligibility", p.gender);
  if (p.status) query = query.eq("global_status", p.status);
  const { data = [], count = 0 } = await query
    .order("code")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const params = new URLSearchParams(
    Object.entries(p).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.22em] text-gold">
        Festival setup
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold">Programs</h1>
          <p className="mt-2 text-sm text-muted">
            Create and manage festival programmes, eligibility and submission
            links.
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/admin/exports/programs?${params}`} className="flex min-h-11 items-center gap-2 rounded-full border border-emerald px-4 text-sm font-bold text-emerald"><Download size={17}/>CSV</a>
          <a href={`/api/admin/exports/programs-xlsx?${params}`} className="flex min-h-11 items-center gap-2 rounded-full border border-emerald px-4 text-sm font-bold text-emerald"><Download size={17}/>Excel</a>
        </div>
      </div>
      <ProgramForm />
      <form className="mt-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-4">
        <label className="relative sm:col-span-1">
          <span className="sr-only">Search</span>
          <Search className="absolute left-3 top-3.5 text-muted" size={17} />
          <input
            name="q"
            defaultValue={p.q}
            placeholder="Code or programme"
            className="h-11 w-full rounded-xl border border-ink/12 pl-10 pr-3"
          />
        </label>
        <Filter
          name="category"
          value={p.category}
          options={["junior", "senior", "super_senior", "general"]}
        />
        <Filter
          name="gender"
          value={p.gender}
          options={["male", "female", "general"]}
        />
        <Filter
          name="status"
          value={p.status}
          options={["not_started", "ongoing", "closed"]}
        />
        <button className="min-h-10 rounded-xl bg-emerald text-sm font-bold text-white sm:col-start-4">
          Apply filters
        </button>
      </form>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Filtered programmes" value={count ?? 0} />
        <Stat
          label="Visible participants"
          value={
            data?.reduce((n, x) => n + x.participant_programs.length, 0) ?? 0
          }
        />
        <Stat
          label="Visible pending"
          value={
            data?.reduce(
              (n, x) =>
                n +
                x.participant_programs.filter(
                  (s: { verification_status: string }) =>
                    s.verification_status === "pending_verification",
                ).length,
              0,
            ) ?? 0
          }
        />
      </div>
      <div className="mt-5 space-y-3">
        {data?.map((program, index) => {
          const selected = program.participant_programs;
          return (
            <article
              key={program.id}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span className="text-xs font-bold text-muted">
                  {(page - 1) * PAGE_SIZE + index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold tracking-wider text-gold">
                    {program.code}
                  </p>
                  <h2 className="font-serif text-xl font-semibold">
                    {program.name}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      ["category", program.category_eligibility],
                      ["gender", program.gender_eligibility],
                      ["status", program.global_status],
                    ].map(([field, value]: string[]) => (
                      <span
                        key={field}
                        className="rounded-full bg-cream px-3 py-1 text-[10px] font-bold uppercase"
                      >
                        {titleCase(value)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <span>
                      <b className="block text-lg">{selected.length}</b>Selected
                    </span>
                    <span>
                      <b className="block text-lg">
                        {
                          selected.filter(
                            (s: { verification_status: string }) =>
                              s.verification_status === "pending_verification",
                          ).length
                        }
                      </b>
                      Pending
                    </span>
                    <span>
                      <b className="block text-lg">
                        {
                          selected.filter(
                            (s: { verification_status: string }) =>
                              s.verification_status === "verified",
                          ).length
                        }
                      </b>
                      Verified
                    </span>
                  </div>
                  {program.description && <p className="mt-4 text-sm leading-6 text-muted">{program.description}</p>}
                  <div className="mt-4"><ProgramEdit program={program}/></div>
                </div>
                <span
                  className={`size-2 rounded-full ${program.submission_form_url ? "bg-emerald" : "bg-amber-500"}`}
                  title={
                    program.submission_form_url
                      ? "Submission link configured"
                      : "Submission link missing"
                  }
                />
              </div>
            </article>
          );
        })}
        {!data?.length && (
          <p className="rounded-2xl border border-dashed p-10 text-center text-muted">
            No programmes match the current filters.
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
function Filter({
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
      {options.map((o) => (
        <option key={o} value={o}>
          {titleCase(o)}
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
