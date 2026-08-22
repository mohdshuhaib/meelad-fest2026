"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Sparkles } from "lucide-react";

export function ProgramForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [isSwalath, setIsSwalath] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const body = Object.fromEntries(formData);
    body.is_swalath_campaign = isSwalath ? "true" : "false";

    const res = await fetch("/api/admin/programs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.message);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-6 flex min-h-11 items-center gap-2 rounded-full bg-emerald px-5 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5"
      >
        <Plus size={17} />
        Add Programme
      </button>
    );

  return (
    <form
      onSubmit={submit}
      className="mt-6 rounded-2xl border border-emerald/20 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold">Add programme</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm font-bold text-muted hover:text-ink"
        >
          Cancel
        </button>
      </div>

      {/* Swalath Campaign Mode Switcher */}
      <div className="mt-5 rounded-xl border border-gold/30 bg-gold/10 p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isSwalath}
            onChange={(e) => setIsSwalath(e.target.checked)}
            className="size-4 accent-emerald"
          />
          <div>
            <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
              <Sparkles size={16} className="text-gold" />
              Swalath Campaign Programme (In-App Daily Count)
            </span>
            <p className="text-xs text-muted">
              Replaces Google Form link with daily date-wise recitation entry from start date to end date.
            </p>
          </div>
        </label>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field name="code" label="Code (e.g. FSS001)" />
        <Field name="name" label="Programme name" />
        <Select
          name="category_eligibility"
          label="Category"
          values={["junior", "senior", "super_senior", "general"]}
        />
        <Select
          name="gender_eligibility"
          label="Gender"
          values={["male", "female", "general"]}
        />
        <Select
          name="global_status"
          label="Global status"
          values={["not_started", "ongoing", "closed"]}
        />

        {isSwalath ? (
          <>
            <label className="text-sm font-bold">
              Campaign Starting Date
              <input
                name="campaign_start_date"
                type="date"
                defaultValue="2026-08-22"
                required
                className="mt-2 h-11 w-full rounded-xl border border-ink/15 px-3 font-semibold"
              />
            </label>
            <label className="text-sm font-bold">
              Campaign Ending Date
              <input
                name="campaign_end_date"
                type="date"
                defaultValue="2026-09-05"
                required
                className="mt-2 h-11 w-full rounded-xl border border-ink/15 px-3 font-semibold"
              />
            </label>
          </>
        ) : (
          <>
            <Field
              name="submission_form_url"
              label="Google Form URL"
              type="url"
            />
            <Field
              name="registration_id_entry_key"
              label="Registration ID entry key"
            />
            <Field
              name="full_name_entry_key"
              label="Full Name entry key"
            />
          </>
        )}

        <label className="text-sm font-bold sm:col-span-2">
          Description
          <textarea
            name="description"
            className="mt-2 min-h-24 w-full rounded-xl border border-ink/15 p-3"
          />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Rules (Malayalam)
          <textarea
            name="rules"
            className="mt-2 min-h-24 w-full rounded-xl border border-ink/15 p-3 font-malayalam"
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <button
        disabled={pending}
        className="mt-5 flex min-h-11 items-center gap-2 rounded-full bg-emerald px-6 text-sm font-bold text-white shadow-md disabled:opacity-50"
      >
        {pending && <LoaderCircle className="animate-spin" size={17} />}
        Create programme
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
}: {
  name: string;
  label: string;
  type?: string;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input
        required={name === "code" || name === "name"}
        name={name}
        type={type}
        className="mt-2 h-11 w-full rounded-xl border border-ink/15 px-3 uppercase"
      />
    </label>
  );
}

function Select({
  name,
  label,
  values,
}: {
  name: string;
  label: string;
  values: string[];
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <select
        name={name}
        className="mt-2 h-11 w-full rounded-xl border border-ink/15 px-3"
      >
        {values.map((v) => (
          <option key={v} value={v}>
            {v.replaceAll("_", " ").toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
