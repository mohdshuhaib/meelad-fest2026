"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, UserPlus } from "lucide-react";
type Settings = Record<string, string | number | boolean | null>;
type Group = {
  id: string;
  name: string;
  primary_coordinator_id: string | null;
};
type Coordinator = {
  id: string;
  username: string;
  name: string;
  whatsapp_number: string;
  is_active: boolean;
  must_change_password: boolean;
  groups: { name: string }[] | { name: string } | null;
};
type Credentials = {
  username: string;
  temporaryPassword: string;
  name: string;
  group: string;
};
const tabs = [
  "General",
  "Account and Security",
  "Coordinators",
  "Groups",
  "Programme Control",
  "Registration Rules",
  "Exports and Data",
];
export function SettingsPanel({
  settings,
  groups,
  coordinators,
}: {
  settings: Settings;
  groups: Group[];
  coordinators: Coordinator[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState("General");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  async function saveGeneral(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    const body = {
      ...raw,
      registration_enabled: raw.registration_enabled === "on",
      registration_open_at: raw.registration_open_at || null,
      registration_close_at: raw.registration_close_at || null,
      program_selection_open_at: raw.program_selection_open_at || null,
      program_selection_close_at: raw.program_selection_close_at || null,
    };
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    setPending(false);
    setMessage(res.ok ? "Settings saved." : d.message);
    if (res.ok) router.refresh();
  }
  async function createCoordinator(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const res = await fetch("/api/admin/coordinators", {
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
    setCredentials(d);
    router.refresh();
  }
  return (
    <div>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${tab === t ? "bg-emerald text-white" : "bg-white text-muted"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {message && (
        <p className="mt-4 rounded-xl bg-white p-3 text-sm font-semibold">
          {message}
        </p>
      )}
      {tab === "General" && (
        <form
          onSubmit={saveGeneral}
          className="mt-5 grid gap-4 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-2"
        >
          <Field
            name="festival_name"
            label="Festival name"
            value={String(settings.festival_name ?? "")}
          />
          <Field
            name="contact_number"
            label="Contact number"
            value={String(settings.contact_number ?? "")}
          />
          {[
            ["registration_open_at", "Registration opens"],
            ["registration_close_at", "Registration closes"],
            ["program_selection_open_at", "Programme selection opens"],
            ["program_selection_close_at", "Programme selection closes"],
          ].map(([name, label]) => (
            <Field
              key={name}
              name={name}
              label={`${label} (IST)`}
              type="datetime-local"
              value={toLocal(settings[name])}
            />
          ))}
          <label className="flex items-center gap-3 rounded-xl bg-cream p-4 text-sm font-bold sm:col-span-2">
            <input
              name="registration_enabled"
              type="checkbox"
              defaultChecked={Boolean(settings.registration_enabled)}
              className="size-4 accent-emerald"
            />
            Registration enabled
          </label>
          <button
            disabled={pending}
            className="min-h-11 rounded-full bg-emerald px-6 text-sm font-bold text-white sm:w-fit"
          >
            Save general settings
          </button>
        </form>
      )}
      {tab === "Account and Security" && (
        <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl font-semibold">Account security</h2>
          <p className="mt-2 text-sm text-muted">
            Use the forced password-change screen to replace the current
            password. Supabase Auth manages secure staff sessions.
          </p>
          <a
            href="/staff/change-password"
            className="mt-5 inline-flex rounded-full bg-emerald px-5 py-3 text-sm font-bold text-white"
          >
            Change admin password
          </a>
        </section>
      )}
      {tab === "Coordinators" && (
        <div className="mt-5">
          <form
            onSubmit={createCoordinator}
            className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-4"
          >
            <Field name="name" label="Coordinator name" />
            <Field name="whatsappNumber" label="WhatsApp number" />
            <label className="text-sm font-bold">
              Group
              <select
                required
                name="groupId"
                className="mt-2 h-11 w-full rounded-xl border border-ink/15 px-3"
              >
                <option value="">Select group</option>
                {groups
                  .filter((g) => !g.primary_coordinator_id)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
              </select>
            </label>
            <button
              disabled={pending}
              className="mt-7 flex h-11 items-center justify-center gap-2 rounded-full bg-emerald px-5 text-sm font-bold text-white"
            >
              <UserPlus size={17} />
              Create coordinator
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {coordinators.map((c) => {
              const group = Array.isArray(c.groups) ? c.groups[0] : c.groups;
              return (
                <div
                  key={c.id}
                  className="grid gap-2 rounded-xl bg-white p-4 sm:grid-cols-4"
                >
                  <b>{c.name}</b>
                  <span className="text-sm">{c.username}</span>
                  <span className="text-sm">{group?.name ?? "NO GROUP"}</span>
                  <span className="text-xs font-bold uppercase text-muted">
                    {c.is_active
                      ? c.must_change_password
                        ? "PASSWORD CHANGE REQUIRED"
                        : "ACTIVE"
                      : "DISABLED"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {tab === "Groups" && (
        <Info
          title="Groups settings"
          text="Create and allocate groups from the dedicated Groups page. Coordinator assignment is handled in the Coordinators tab."
          link="/admin/groups"
        />
      )}
      {tab === "Programme Control" && (
        <Info
          title="Programme control"
          text="Search, filter, create and control programme status from the Programs page."
          link="/admin/programs"
        />
      )}
      {tab === "Registration Rules" && (
        <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl font-semibold">
            Confirmed registration rules
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>Minimum age: 15</li>
            <li>Junior: 15-25</li>
            <li>Senior: 26-40</li>
            <li>Super Senior: 41+</li>
            <li>Age cutoff: exact registration date</li>
            <li>Maximum selected programmes: 4</li>
          </ul>
        </section>
      )}
      {tab === "Exports and Data" && (
        <Info
          title="Exports and data"
          text="Filtered exports are available on Participants and Programs. Every export is recorded in the export log."
          link="/admin/participants"
        />
      )}
      {credentials && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-6"
          >
            <span className="grid size-12 place-items-center rounded-full bg-emerald text-white">
              <Check />
            </span>
            <h2 className="mt-4 font-serif text-2xl font-semibold">
              Coordinator created
            </h2>
            <p className="mt-2 text-sm text-muted">
              Share these credentials privately. The password will not be shown
              again.
            </p>
            <Credential label="Username" value={credentials.username} />
            <Credential
              label="Temporary password"
              value={credentials.temporaryPassword}
            />
            <button
              onClick={() => setCredentials(null)}
              className="mt-5 min-h-11 w-full rounded-full bg-emerald font-bold text-white"
            >
              I have saved the credentials
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function Field({
  name,
  label,
  value = "",
  type = "text",
}: {
  name: string;
  label: string;
  value?: string;
  type?: string;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={value}
        className="mt-2 h-11 w-full rounded-xl border border-ink/15 px-3"
      />
    </label>
  );
}
function toLocal(v: unknown) {
  if (!v) return "";
  const d = new Date(String(v));
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(d)
    .replace(" ", "T");
}
function Info({
  title,
  text,
  link,
}: {
  title: string;
  text: string;
  link: string;
}) {
  return (
    <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted">{text}</p>
      <a href={link} className="mt-4 inline-block font-bold text-emerald">
        Open management page
      </a>
    </section>
  );
}
function Credential({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 rounded-xl bg-cream p-4">
      <p className="text-xs font-bold uppercase text-muted">{label}</p>
      <div className="mt-1 flex items-center justify-between">
        <code className="text-lg font-bold">{value}</code>
        <button
          onClick={() => navigator.clipboard.writeText(value)}
          aria-label={`Copy ${label}`}
        >
          <Copy size={17} />
        </button>
      </div>
    </div>
  );
}
