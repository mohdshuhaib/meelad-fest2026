import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Users,
  VenusAndMars,
  ListChecks,
  BadgeCheck,
  Clock3,
  UserRoundX,
  Group,
  type LucideIcon,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/staff-auth";
// Supabase's ungenerated client exposes its fluent query builder as `any` here.
/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AdminHome() {
  await requireAdmin();
  const db = createAdminClient();
  const count = async (table: string, apply?: (q: any) => any) => {
    let q = db.from(table).select("id", { count: "exact", head: true });
    if (apply) q = apply(q);
    return (await q).count ?? 0;
  };
  const [
    total,
    male,
    female,
    selections,
    verified,
    pending,
    unassigned,
    groups,
    junior,
    senior,
    superSenior,
    noForms,
    groupsNoCoord,
    tempPasswords,
    recent,
    audits,
  ] = await Promise.all([
    count("participants", (q) => q.eq("is_active", true)),
    count("participants", (q) => q.eq("is_active", true).eq("gender", "male")),
    count("participants", (q) =>
      q.eq("is_active", true).eq("gender", "female"),
    ),
    count("participant_programs"),
    count("participant_programs", (q) =>
      q.eq("verification_status", "verified"),
    ),
    count("participant_programs", (q) =>
      q.eq("verification_status", "pending_verification"),
    ),
    count("participants", (q) => q.eq("is_active", true).is("group_id", null)),
    count("groups", (q) => q.eq("is_active", true)),
    count("participants", (q) =>
      q.eq("is_active", true).eq("category", "junior"),
    ),
    count("participants", (q) =>
      q.eq("is_active", true).eq("category", "senior"),
    ),
    count("participants", (q) =>
      q.eq("is_active", true).eq("category", "super_senior"),
    ),
    count("programs", (q) => q.is("submission_form_url", null)),
    count("groups", (q) =>
      q.eq("is_active", true).is("primary_coordinator_id", null),
    ),
    count("profiles", (q) =>
      q
        .eq("role", "coordinator")
        .eq("must_change_password", true)
        .eq("is_active", true),
    ),
    db
      .from("participants")
      .select("registration_id,name,category,registered_at")
      .eq("is_active", true)
      .order("registered_at", { ascending: false })
      .limit(5),
    db
      .from("audit_logs")
      .select("id,action,entity_type,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const stats: Array<[string, number, LucideIcon]> = [
    ["Total Participants", total, Users],
    ["Male Participants", male, VenusAndMars],
    ["Female Participants", female, VenusAndMars],
    ["Programme Selections", selections, ListChecks],
    ["Verified Submissions", verified, BadgeCheck],
    ["Pending Verifications", pending, Clock3],
    ["Unassigned Participants", unassigned, UserRoundX],
    ["Active Groups", groups, Group],
  ];
  const warnings = [
    [unassigned, "Participants without groups", "/admin/groups"],
    [groupsNoCoord, "Groups without coordinators", "/admin/settings"],
    [noForms, "Programmes without form links", "/admin/programs"],
    [pending, "Pending verification items", "/admin/status"],
    [tempPasswords, "Coordinators with temporary passwords", "/admin/settings"],
  ] as const;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.22em] text-gold">
        Dashboard overview
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold">
        WELCOME, MODERATOR
      </h1>
      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value, Icon]) => (
          <article
            key={label as string}
            className="rounded-2xl bg-white p-4 shadow-sm sm:p-5"
          >
            <Icon className="text-emerald" size={20} />
            <p className="mt-4 text-2xl font-bold">{value as number}</p>
            <p className="mt-1 text-xs font-semibold text-muted">
              {label as string}
            </p>
          </article>
        ))}
      </div>
      <section className="mt-7 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl font-semibold">Category breakdown</h2>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[
            ["Junior", junior],
            ["Senior", senior],
            ["Super Senior", superSenior],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl bg-cream p-4">
              <b className="text-xl">{value}</b>
              <p className="mt-1 text-[10px] font-bold uppercase text-muted">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        <section>
          <h2 className="font-serif text-xl font-semibold">Attention needed</h2>
          <div className="mt-3 space-y-2">
            {warnings.map(([value, label, href]) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900"
              >
                <AlertTriangle size={18} />
                <span>
                  {value} {label}
                </span>
                <ArrowRight className="ml-auto" size={16} />
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-serif text-xl font-semibold">
            Recent registrations
          </h2>
          <div className="mt-3 overflow-hidden rounded-xl bg-white shadow-sm">
            {recent.data?.map((p) => (
              <div
                key={p.registration_id}
                className="flex items-center justify-between border-b border-ink/6 p-4 last:border-0"
              >
                <div>
                  <b className="text-sm">{p.name}</b>
                  <p className="text-xs text-muted">{p.registration_id}</p>
                </div>
                <span className="text-[10px] font-bold uppercase text-emerald">
                  {p.category.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
          <h2 className="mt-6 font-serif text-xl font-semibold">
            Recent administrative activity
          </h2>
          <div className="mt-3 rounded-xl bg-white p-4 shadow-sm">
            {audits.data?.length ? (
              audits.data.map((a) => (
                <p key={a.id} className="border-b py-2 text-xs last:border-0">
                  <b>{a.action}</b> · {a.entity_type}
                </p>
              ))
            ) : (
              <p className="text-sm text-muted">
                No administrative activity recorded yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
