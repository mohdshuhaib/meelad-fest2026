"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, X } from "lucide-react";

type EditableProgram={id:string;code:string;name:string;description:string|null;submission_form_url:string|null;registration_id_entry_key:string|null;full_name_entry_key:string|null;global_status:string};

export function ProgramEdit({program}:{program:EditableProgram}){
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState("");
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setPending(true);setError("");
    const response=await fetch(`/api/admin/programs/${program.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))});
    const result=await response.json();setPending(false);
    if(!response.ok){setError(result.message??"Programme could not be updated.");return}
    setOpen(false);router.refresh();
  }
  return <>
    <button onClick={()=>setOpen(true)} className="flex min-h-10 items-center gap-2 rounded-full border border-emerald px-4 text-xs font-bold text-emerald"><Pencil size={15}/>Edit</button>
    {open&&<div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/55 p-4"><div role="dialog" aria-modal="true" aria-labelledby={`edit-${program.id}`} className="my-4 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-wider text-gold">{program.code}</p><h2 id={`edit-${program.id}`} className="font-serif text-2xl font-semibold">Edit {program.name}</h2><p className="mt-1 text-sm text-muted">Programme identity and eligibility remain unchanged.</p></div><button onClick={()=>setOpen(false)} aria-label="Close edit dialog" className="grid size-10 place-items-center rounded-full bg-cream"><X size={18}/></button></div><form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-bold">Google Form URL<input name="submission_form_url" type="url" defaultValue={program.submission_form_url??""} placeholder="https://docs.google.com/forms/..." className="mt-2 h-11 w-full rounded-xl border border-ink/15 px-3"/><span className="mt-1 block text-xs font-normal text-muted">May be left blank until the programme form is ready.</span></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Registration ID entry key<input name="registration_id_entry_key" inputMode="numeric" pattern="[0-9]*" defaultValue={program.registration_id_entry_key??""} placeholder="123456789" className="mt-2 h-11 w-full rounded-xl border border-ink/15 px-3"/></label><label className="text-sm font-bold">Full Name entry key<input name="full_name_entry_key" inputMode="numeric" pattern="[0-9]*" defaultValue={program.full_name_entry_key??""} placeholder="987654321" className="mt-2 h-11 w-full rounded-xl border border-ink/15 px-3"/></label></div><label className="block text-sm font-bold">Global status<select name="global_status" defaultValue={program.global_status} className="mt-2 h-11 w-full rounded-xl border border-ink/15 px-3"><option value="not_started">Not Started</option><option value="ongoing">Ongoing</option><option value="closed">Closed</option></select></label><label className="block text-sm font-bold">Description<textarea name="description" defaultValue={program.description??""} maxLength={1000} className="mt-2 min-h-28 w-full rounded-xl border border-ink/15 p-3"/></label>{error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}<div className="flex justify-end gap-3"><button type="button" onClick={()=>setOpen(false)} className="min-h-11 rounded-full border px-5 text-sm font-bold">Cancel</button><button disabled={pending} className="flex min-h-11 items-center gap-2 rounded-full bg-emerald px-6 text-sm font-bold text-white disabled:opacity-50">{pending&&<LoaderCircle size={17} className="animate-spin"/>}Save changes</button></div></form></div></div>}
  </>;
}
