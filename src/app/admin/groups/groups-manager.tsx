"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LoaderCircle, Plus, Shuffle, Users } from "lucide-react";

type Person = {
  id: string;
  registration_id: string;
  name: string;
  gender: string;
  category: string;
  whatsapp_number?: string | null;
  phone_number?: string | null;
};
type Group = {
  id: string;
  name: string;
  whatsapp_group_link: string | null;
  is_active: boolean;
  coordinator: string | null;
  total: number;
  male: number;
  female: number;
  junior: number;
  senior: number;
  superSenior: number;
  participants: Person[];
};
type Preview = {
  assignments: { participant_id: string; group_id: string }[];
  summary: Array<{
    id: string;
    name: string;
    total: number;
    male: number;
    female: number;
    junior: number;
    senior: number;
    super_senior: number;
  }>;
  participantCount: number;
};

export function GroupsManager({
  groups,
  unassigned,
}: {
  groups: Group[];
  unassigned: Person[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [moving, setMoving] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage("");
    const res = await fetch("/api/admin/groups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    });
    const d = await res.json();
    setPending(false);
    if (!res.ok) {
      setMessage(d.message);
      return;
    }
    setCreating(false);
    router.refresh();
  }

  async function loadPreview() {
    setPending(true);
    setMessage("");
    const res = await fetch("/api/admin/groups/allocation");
    const d = await res.json();
    setPending(false);
    if (!res.ok) {
      setMessage(d.message);
      return;
    }
    setPreview(d);
  }

  async function confirm() {
    if (!preview) return;
    setPending(true);
    setMessage("");
    const res = await fetch("/api/admin/groups/allocation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assignments: preview.assignments }),
    });
    const d = await res.json();
    setPending(false);
    if (!res.ok) {
      setMessage(d.message);
      return;
    }
    setPreview(null);
    router.refresh();
  }

  async function assign(participantId: string, groupId: string) {
    if (!groupId) return;
    setMoving(participantId);
    setMessage("");
    const res = await fetch("/api/admin/groups/assign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ participantId, groupId }),
    });
    const d = await res.json().catch(() => ({}));
    setMoving("");
    if (!res.ok) {
      setMessage(d.message ?? "Group change failed.");
      return;
    }
    router.refresh();
  }

  const activeGroups = groups.filter((g) => g.is_active);

  return (
    <div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => setCreating(!creating)}
          className="flex min-h-11 items-center gap-2 rounded-full bg-emerald px-5 text-sm font-bold text-white"
        >
          <Plus size={17} />
          Create group
        </button>
        <button
          onClick={loadPreview}
          disabled={pending || !unassigned.length}
          className="flex min-h-11 items-center gap-2 rounded-full border border-emerald px-5 text-sm font-bold text-emerald disabled:opacity-40"
        >
          <Shuffle size={17} />
          Preview balanced allocation
        </button>
      </div>

      {creating && (
        <form
          onSubmit={create}
          className="mt-4 grid gap-3 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto]"
        >
          <input
            required
            name="name"
            placeholder={`GROUP ${groups.length + 1}`}
            className="h-11 rounded-xl border border-ink/15 px-3 uppercase"
          />
          <input
            name="whatsappGroupLink"
            type="url"
            placeholder="WhatsApp group link (optional)"
            className="h-11 rounded-xl border border-ink/15 px-3"
          />
          <button
            disabled={pending}
            className="rounded-xl bg-emerald px-5 text-sm font-bold text-white"
          >
            Save group
          </button>
        </form>
      )}

      {message && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          {message}
        </p>
      )}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {groups.map((g) => (
          <details key={g.id} className="rounded-2xl bg-white shadow-sm">
            <summary className="cursor-pointer list-none p-5">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-gold">
                    {g.is_active ? "ACTIVE" : "DISABLED"}
                  </p>
                  <h2 className="font-serif text-2xl font-semibold">
                    {g.name}
                  </h2>
                  <p className="mt-2 text-xs text-muted">
                    Coordinator: {g.coordinator ?? "NOT ASSIGNED"}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-emerald">
                  <Users />
                  <ChevronDown size={18} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
                <Metric value={g.total} label="Total" />
                <Metric value={g.male} label="Male" />
                <Metric value={g.female} label="Female" />
                <Metric value={g.junior} label="Junior" />
                <Metric value={g.senior} label="Senior" />
                <Metric value={g.superSenior} label="Super Sr." />
              </div>
            </summary>

            <div className="border-t border-ink/7 p-5">
              <h3 className="font-serif text-xl font-semibold">
                Group participants
              </h3>
              <div className="mt-4 space-y-2">
                {g.participants.map((p) => (
                  <div
                    key={p.id}
                    className="grid gap-3 rounded-xl border border-ink/8 p-4 md:grid-cols-[1fr_220px] md:items-center"
                  >
                    <div>
                      <b className="text-sm">{p.name}</b>
                      <p className="mt-1 text-xs text-muted">
                        {p.registration_id} · {p.gender} ·{" "}
                        {p.category.replace("_", " ")}
                        {p.whatsapp_number ? ` · ${p.whatsapp_number}` : ""}
                      </p>
                    </div>
                    <select
                      value={g.id}
                      onChange={(e) => assign(p.id, e.target.value)}
                      disabled={moving === p.id}
                      className="h-10 rounded-xl border border-ink/15 px-3 text-sm disabled:opacity-50"
                    >
                      {activeGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {!g.participants.length && (
                  <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted">
                    No participants are assigned to this group yet.
                  </p>
                )}
              </div>
            </div>
          </details>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="font-serif text-2xl font-semibold">
          Unassigned participants
        </h2>
        <p className="mt-1 text-sm text-muted">
          Showing up to 100 recent unassigned participants.
        </p>
        <div className="mt-4 space-y-2">
          {unassigned.map((p) => (
            <div
              key={p.id}
              className="grid gap-3 rounded-xl bg-white p-4 sm:grid-cols-[1fr_200px] sm:items-center"
            >
              <div>
                <b className="text-sm">{p.name}</b>
                <p className="text-xs text-muted">
                  {p.registration_id} · {p.gender} ·{" "}
                  {p.category.replace("_", " ")}
                </p>
              </div>
              <select
                onChange={(e) => assign(p.id, e.target.value)}
                defaultValue=""
                disabled={moving === p.id}
                className="h-10 rounded-xl border border-ink/15 px-3 text-sm disabled:opacity-50"
              >
                <option value="" disabled>
                  Assign group
                </option>
                {activeGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {!unassigned.length && (
            <p className="rounded-xl border border-dashed p-8 text-center text-muted">
              Every active participant is assigned.
            </p>
          )}
        </div>
      </section>

      {preview && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="allocation-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6"
          >
            <h2 id="allocation-title" className="font-serif text-2xl font-semibold">
              Allocation preview
            </h2>
            <p className="mt-2 text-sm text-muted">
              {preview.participantCount} unassigned participants will be
              distributed while existing assignments remain locked.
            </p>
            <div className="mt-5 space-y-2">
              {preview.summary.map((g) => (
                <div
                  key={g.id}
                  className="grid grid-cols-4 rounded-xl bg-cream p-3 text-center text-xs"
                >
                  <b className="text-left">{g.name}</b>
                  <span>{g.total} total</span>
                  <span>
                    {g.male} M / {g.female} F
                  </span>
                  <span>
                    {g.junior} J · {g.senior} S · {g.super_senior} SS
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setPreview(null)}
                className="rounded-full border px-5 py-2 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                disabled={pending}
                className="flex items-center gap-2 rounded-full bg-emerald px-5 py-2 text-sm font-bold text-white"
              >
                {pending && <LoaderCircle className="animate-spin" size={16} />}
                Confirm allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg bg-cream p-2">
      <b className="block text-lg">{value}</b>
      {label}
    </div>
  );
}
