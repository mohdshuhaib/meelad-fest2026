import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarDays, LockKeyhole, Users } from "lucide-react";

const features = [
  { icon: BadgeCheck, title: "Simple registration", text: "Register once and keep your private credentials safe." },
  { icon: CalendarDays, title: "Programme selection", text: "Choose up to four programmes matched to your eligibility." },
  { icon: Users, title: "Guided participation", text: "Stay connected with your assigned group and coordinator." },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-cream text-ink">
      <section className="relative isolate px-5 pb-20 pt-6 sm:px-8 lg:px-12">
        <div className="absolute inset-x-0 top-0 -z-10 h-[44rem] bg-[radial-gradient(circle_at_80%_10%,rgba(208,169,91,.24),transparent_28%),linear-gradient(155deg,#063d35_0%,#0b5549_62%,#f5f0e4_62%)]" />
        <nav className="mx-auto flex max-w-6xl items-center justify-between text-white">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-wide">
            <span className="grid size-10 place-items-center rounded-full border border-gold/60 bg-white/10 text-gold">AS</span>
            <span className="hidden sm:block">AHLU SAADA</span>
          </Link>
          <Link href="/login" className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold transition hover:bg-white hover:text-emerald">Participant login</Link>
        </nav>

        <div className="mx-auto grid max-w-6xl gap-12 pb-20 pt-24 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:pt-32">
          <div className="max-w-2xl text-white">
            <p className="mb-5 text-sm font-bold uppercase tracking-[.28em] text-gold">Celebrating faith · knowledge · community</p>
            <h1 className="font-serif text-5xl font-semibold leading-[1.04] sm:text-7xl">Meelad Fest <span className="text-gold">2026</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">A shared stage for talent, learning and togetherness. Register securely, discover your programmes and follow every step of your festival journey.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3.5 font-bold text-emerald shadow-xl shadow-black/15 transition hover:-translate-y-0.5">Register now <ArrowRight size={18}/></Link>
              <Link href="/login" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-white/10 px-7 py-3.5 font-semibold ring-1 ring-white/30 backdrop-blur transition hover:bg-white/20"><LockKeyhole size={17}/> Access dashboard</Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="relative ml-auto aspect-square max-w-md rounded-[3rem] border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-sm">
              <div className="grid h-full place-items-center rounded-[2.3rem] border border-gold/35 bg-[radial-gradient(circle,#d0a95b33_1px,transparent_1px)] [background-size:20px_20px]">
                <div className="text-center"><p className="font-serif text-8xl text-gold">✦</p><p className="mt-3 text-xs font-bold uppercase tracking-[.35em] text-white/65">Grow together</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-8 grid max-w-6xl gap-4 px-5 pb-24 sm:px-8 md:grid-cols-3">
        {features.map(({icon: Icon, title, text}) => <article key={title} className="rounded-3xl border border-ink/8 bg-white p-6 shadow-sm"><span className="grid size-11 place-items-center rounded-2xl bg-emerald/10 text-emerald"><Icon size={21}/></span><h2 className="mt-5 font-serif text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{text}</p></article>)}
      </section>
    </main>
  );
}
