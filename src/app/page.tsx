import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

export default function Home() {
  return (
    <main className="relative grid min-h-svh overflow-hidden bg-[#082f2a] px-4 py-5 text-white sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(208,169,91,.35),transparent_26%),radial-gradient(circle_at_86%_22%,rgba(255,255,255,.16),transparent_20%),linear-gradient(145deg,#063d35_0%,#0b5549_47%,#f5f0e4_47%,#f5f0e4_100%)]" />
      <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 blur-sm" />
      <div className="pointer-events-none absolute -left-20 bottom-[-9rem] size-80 rounded-full bg-gold/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-[-9rem] size-96 rounded-full bg-emerald/45 blur-3xl" />

      <section className="relative z-10 mx-auto grid min-h-[calc(100svh-2.5rem)] w-full max-w-6xl place-items-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1fr_.9fr]">
          <div className="text-center lg:text-left">
            <div className="mx-auto mb-5 grid size-16 place-items-center rounded-[1.4rem] border border-gold/50 bg-white/10 text-xl font-black text-gold shadow-2xl shadow-black/25 backdrop-blur lg:mx-0">
              AS
            </div>
            <p className="text-xs font-bold uppercase tracking-[.35em] text-gold">
              Ahlu Saada
            </p>
            <h1 className="mx-auto mt-4 max-w-3xl font-serif text-5xl font-semibold leading-[.95] text-white drop-shadow-2xl sm:text-7xl lg:mx-0 lg:text-8xl">
              Meelad Fest <span className="text-gold">2026</span>
            </h1>

            <div className="mx-auto mt-8 grid max-w-sm gap-3 sm:max-w-xl sm:grid-cols-2 lg:mx-0">
              <Link
                href="/register"
                className="group flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-gold px-6 text-base font-black text-emerald shadow-[0_18px_35px_rgba(0,0,0,.28)] transition hover:-translate-y-1 hover:shadow-[0_24px_45px_rgba(0,0,0,.34)]"
              >
                <UserPlus size={21} />
                Registration
              </Link>
              <Link
                href="/login"
                className="flex min-h-16 items-center justify-center gap-3 rounded-2xl border border-white/30 bg-white/15 px-6 text-base font-black text-white shadow-[0_18px_35px_rgba(0,0,0,.2)] backdrop-blur transition hover:-translate-y-1 hover:bg-white/25"
              >
                <LogIn size={21} />
                Login
              </Link>
            </div>
          </div>

          <div className="hidden [perspective:1200px] lg:block">
            <div className="relative ml-auto aspect-square max-w-[28rem] rotate-[-7deg] rounded-[3rem] border border-white/25 bg-white/10 p-5 shadow-[0_35px_90px_rgba(0,0,0,.35)] backdrop-blur-xl [transform-style:preserve-3d]">
              <div className="absolute -right-8 -top-8 size-24 rounded-3xl bg-gold shadow-[0_24px_55px_rgba(208,169,91,.35)] [transform:translateZ(55px)]" />
              <div className="absolute -bottom-8 -left-7 size-28 rounded-full bg-emerald shadow-[0_24px_55px_rgba(0,0,0,.25)] [transform:translateZ(45px)]" />
              <div className="grid h-full place-items-center rounded-[2.4rem] border border-gold/40 bg-[radial-gradient(circle,#d0a95b3b_1px,transparent_1px)] shadow-inner [background-size:22px_22px] [transform:translateZ(30px)]">
                <div className="text-center">
                  <p className="font-serif text-9xl text-gold drop-shadow-2xl">✦</p>
                  <p className="mt-2 text-xs font-black uppercase tracking-[.35em] text-white/70">
                    Enter
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
