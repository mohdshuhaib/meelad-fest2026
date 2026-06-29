import { z } from "zod";
import { DISTRICTS } from "./constants";

const normalise = (value:string) => value.trim().replace(/\s+/g," ").toUpperCase();
const nameLike = z.string().min(2).max(160).transform(normalise).pipe(z.string().regex(/^[A-Z '-]+$/, "Use English letters, spaces, apostrophes or hyphens only"));
const phone = z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

export function getAgeAndCategory(dob:string, now=new Date()) {
  const birth = new Date(`${dob}T00:00:00+05:30`);
  if (Number.isNaN(birth.getTime()) || birth > now) throw new Error("Enter a valid date of birth");
  const today = new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
  const [y,m,d] = today.split("-").map(Number); const [by,bm,bd] = dob.split("-").map(Number);
  const age = y-by-((m<bm || (m===bm && d<bd))?1:0);
  return { age, category:age<=25?"junior":age<=40?"senior":"super_senior" } as const;
}

export const registrationSchema = z.object({
  name:nameLike, place:nameLike, district:z.enum(DISTRICTS), dateOfBirth:z.string(),
  gender:z.enum(["male","female"]), whatsappNumber:phone, phoneNumber:phone,
}).superRefine((data,ctx)=>{ try { const {age}=getAgeAndCategory(data.dateOfBirth); if(age<15) ctx.addIssue({code:"custom",path:["dateOfBirth"],message:"You must be at least 15 years old"}); } catch(e) { ctx.addIssue({code:"custom",path:["dateOfBirth"],message:e instanceof Error?e.message:"Invalid date"}); } });

export type RegistrationInput = z.input<typeof registrationSchema>;
export type RegistrationOutput = z.output<typeof registrationSchema>;

const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function createRegistrationId(gender:"male"|"female",category:string) {
  const prefix=`RF${gender==="male"?"M":"F"}${category==="junior"?"J":category==="senior"?"S":"P"}`;
  const bytes=crypto.getRandomValues(new Uint8Array(8));
  return prefix+Array.from(bytes,b=>chars[b%chars.length]).join("");
}
export function createAccessCode(){ return String(crypto.getRandomValues(new Uint32Array(1))[0]%1_000_000).padStart(6,"0"); }
