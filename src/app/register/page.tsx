import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { RegistrationForm } from "./registration-form";

export const metadata: Metadata = { title: "Register" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatIst(value: string) {
  return (
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date(value)) + " IST"
  );
}

export default async function RegisterPage() {
  const { data: settings } = await createAdminClient()
    .from("app_settings")
    .select("registration_enabled,registration_open_at,registration_close_at")
    .eq("id", true)
    .single();
  const now = new Date();
  const notStarted = Boolean(
    settings?.registration_open_at &&
      now < new Date(settings.registration_open_at),
  );
  const closed = Boolean(
    !settings?.registration_enabled ||
      (settings?.registration_close_at &&
        now > new Date(settings.registration_close_at)),
  );
  const blocked = notStarted || closed;

  return (
    <main className="min-h-screen bg-cream px-4 py-5 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald"
        >
          <ArrowLeft size={16} /> Back to home
        </Link>
        <header className="mt-8 mb-8">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-gold">
            Ahlu Saada · Meelad Fest 2026
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">
            Participant registration
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted">
            Enter your details exactly as they should appear on festival
            records. All fields are required.
          </p>
        </header>
        <div className="rounded-[2rem] border border-ink/8 bg-white p-5 shadow-sm sm:p-9">
          {blocked ? (
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[.22em] text-gold">
                {notStarted ? "Registration not started" : "Registration closed"}
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold">
                {notStarted
                  ? "Registration has not started yet."
                  : "Registration is closed."}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
                {notStarted && settings?.registration_open_at
                  ? `Registration will open on ${formatIst(settings.registration_open_at)}.`
                  : settings?.registration_close_at
                    ? `Registration closed on ${formatIst(settings.registration_close_at)}.`
                    : "Registration is currently disabled by the admin."}
              </p>
            </div>
          ) : (
            <RegistrationForm />
          )}
        </div>
        <p className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 text-center text-xs leading-5 text-muted">
          <ShieldCheck size={16} className="shrink-0 text-emerald" /> Your
          access code is securely hashed and never included in public records.
        </p>
      </div>
    </main>
  );
}
