"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useSyncExternalStore } from "react";
import { Check, LogIn, ShieldAlert } from "lucide-react";
import { RegistrationPdfButton } from "./pdf-button";

type Result={token:string;registrationId:string;accessCode:string;name:string;category:string;registeredAt:string};
function Content(){
  const token=useSearchParams().get("token");
  const raw=useSyncExternalStore(()=>()=>{},()=>token?sessionStorage.getItem(`registration:${token}`):null,()=>null);
  const data:Result|null=raw?JSON.parse(raw):null;
  if(!data)return <div className="text-center"><h1 className="font-serif text-3xl">Registration details unavailable</h1><p className="mt-3 text-muted">For your security, credentials are shown only once in this browser.</p><Link href="/login" className="mt-6 inline-block font-bold text-emerald">Open participant login</Link></div>;
  return <div className="text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald text-white"><Check size={30}/></span><p className="mt-6 text-xs font-bold uppercase tracking-[.24em] text-gold">Registration successful</p><h1 className="mt-2 font-serif text-4xl font-semibold">Welcome, {data.name}</h1><p className="mt-3 text-muted">{data.category.replace("_"," ").toUpperCase()} · {new Intl.DateTimeFormat("en-IN",{dateStyle:"long",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(data.registeredAt))} IST</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><Credential label="Registration ID" value={data.registrationId}/><Credential label="Access code" value={data.accessCode}/></div><div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm font-bold text-amber-900"><ShieldAlert className="shrink-0" size={20}/>KEEP YOUR ACCESS CODE PRIVATE. DO NOT SHARE IT WITH ANYONE.</div><div className="mt-7 grid gap-3 sm:grid-cols-2"><RegistrationPdfButton registrationId={data.registrationId} accessCode={data.accessCode}/><Link href={`/login?registrationId=${data.registrationId}`} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald px-5 font-bold text-white"><LogIn size={18}/>Open participant login</Link></div></div>;
}
function Credential({label,value}:{label:string;value:string}){return <div className="rounded-2xl bg-cream p-5"><p className="text-xs font-bold uppercase tracking-widest text-muted">{label}</p><p className="mt-2 font-mono text-2xl font-bold tracking-wider text-emerald">{value}</p></div>}
export default function Success(){return <main className="grid min-h-screen place-items-center bg-cream p-4"><div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-xl sm:p-10"><Suspense fallback={<p>Loading…</p>}><Content/></Suspense></div></main>}
