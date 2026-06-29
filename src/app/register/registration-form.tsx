"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { DISTRICTS } from "@/lib/constants";
import { getAgeAndCategory, registrationSchema, type RegistrationInput } from "@/lib/registration";

const inputClass="mt-2 h-12 w-full rounded-xl border border-ink/15 bg-white px-4 text-base transition placeholder:text-ink/30";
const labelClass="text-sm font-bold text-ink";
export function RegistrationForm(){
  const router=useRouter(); const [serverError,setServerError]=useState("");
  const {register,handleSubmit,control,setValue,formState:{errors,isSubmitting}}=useForm<RegistrationInput>({resolver:zodResolver(registrationSchema),defaultValues:{gender:"male"}});
  const dob=useWatch({control,name:"dateOfBirth"}); const whatsapp=useWatch({control,name:"whatsappNumber"}); const phone=useWatch({control,name:"phoneNumber"}); const same=phone===whatsapp && Boolean(whatsapp);
  const ageInfo=useMemo(()=>{try{return dob?getAgeAndCategory(dob):null}catch{return null}},[dob]);
  async function submit(data:RegistrationInput){ setServerError(""); const res=await fetch("/api/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)}); const result=await res.json(); if(!res.ok){setServerError(result.message??"Registration could not be completed.");return} sessionStorage.setItem(`registration:${result.token}`,JSON.stringify(result)); router.push(`/register/success?token=${result.token}`); }
  const field=(name:keyof RegistrationInput)=>errors[name]?.message as string|undefined;
  return <form onSubmit={handleSubmit(submit)} className="space-y-7" noValidate>
    <div className="grid gap-6 sm:grid-cols-2">
      <label className={labelClass}>Name<input {...register("name")} onInput={e=>e.currentTarget.value=e.currentTarget.value.toUpperCase()} autoComplete="name" placeholder="YOUR FULL NAME" className={inputClass}/>{field("name")&&<Error text={field("name")!}/>}</label>
      <label className={labelClass}>Place<input {...register("place")} onInput={e=>e.currentTarget.value=e.currentTarget.value.toUpperCase()} placeholder="YOUR PLACE" className={inputClass}/>{field("place")&&<Error text={field("place")!}/>}</label>
      <label className={labelClass}>District<select {...register("district")} className={inputClass} defaultValue=""><option value="" disabled>Select district</option>{DISTRICTS.map(d=><option key={d}>{d}</option>)}</select>{field("district")&&<Error text={field("district")!}/>}</label>
      <label className={labelClass}>Date of birth<input {...register("dateOfBirth")} type="date" max={new Date().toISOString().slice(0,10)} className={inputClass}/>{ageInfo&&<span className="mt-2 block text-xs font-semibold text-emerald">Age {ageInfo.age} · {ageInfo.category.replace("_"," ").toUpperCase()}</span>}{field("dateOfBirth")&&<Error text={field("dateOfBirth")!}/>}</label>
    </div>
    <fieldset><legend className={labelClass}>Gender</legend><div className="mt-3 grid grid-cols-2 gap-3">{(["male","female"] as const).map(g=><label key={g} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-ink/15 px-4 font-semibold capitalize has-[:checked]:border-emerald has-[:checked]:bg-emerald/5"><input {...register("gender")} type="radio" value={g} className="accent-emerald"/>{g}</label>)}</div></fieldset>
    <div className="grid gap-6 sm:grid-cols-2"><label className={labelClass}>WhatsApp number<input {...register("whatsappNumber")} inputMode="numeric" autoComplete="tel" maxLength={10} placeholder="9645184118" className={inputClass}/>{field("whatsappNumber")&&<Error text={field("whatsappNumber")!}/>}</label><label className={labelClass}>Phone number<input {...register("phoneNumber")} inputMode="numeric" autoComplete="tel" maxLength={10} placeholder="9645184118" className={inputClass}/>{field("phoneNumber")&&<Error text={field("phoneNumber")!}/>}</label></div>
    <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-cream/70 p-4 text-sm font-semibold"><input type="checkbox" checked={same} onChange={e=>setValue("phoneNumber",e.target.checked?whatsapp:"")} className="mt-0.5 size-4 accent-emerald"/> Phone number is the same as WhatsApp number</label>
    {serverError&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{serverError}</div>}
    <button disabled={isSubmitting} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-emerald px-6 py-4 font-bold text-white transition hover:bg-[#063d35] disabled:opacity-60">{isSubmitting&&<LoaderCircle size={18} className="animate-spin"/>}{isSubmitting?"Registering securely…":"Complete registration"}</button>
    <p className="text-center text-xs leading-5 text-muted">By registering, you confirm that the details are accurate and that you are at least 15 years old.</p>
  </form>
}
function Error({text}:{text:string}){return <span role="alert" className="mt-1.5 block text-xs font-medium text-red-600">{text}</span>}
