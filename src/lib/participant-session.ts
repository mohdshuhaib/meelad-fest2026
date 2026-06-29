import "server-only";
import { createHash, randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "./supabase/admin";

export const PARTICIPANT_COOKIE="as_participant";
const SESSION_DAYS=14;
export const hashToken=(token:string)=>createHash("sha256").update(token).digest("hex");

export async function createParticipantSession(participantId:string){
  const token=randomBytes(32).toString("base64url"); const expiresAt=new Date(Date.now()+SESSION_DAYS*86400000); const requestHeaders=await headers();
  const {error}=await createAdminClient().from("participant_sessions").insert({participant_id:participantId,token_hash:hashToken(token),expires_at:expiresAt.toISOString(),ip_address:(requestHeaders.get("x-forwarded-for")??"").split(",")[0]||null,user_agent:requestHeaders.get("user-agent")});
  if(error)throw error;
  (await cookies()).set(PARTICIPANT_COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",expires:expiresAt});
}

export async function clearParticipantSession(){
  const store=await cookies(); const token=store.get(PARTICIPANT_COOKIE)?.value;
  if(token)await createAdminClient().from("participant_sessions").update({revoked_at:new Date().toISOString()}).eq("token_hash",hashToken(token));
  store.delete(PARTICIPANT_COOKIE);
}

export async function getParticipant(){
  const token=(await cookies()).get(PARTICIPANT_COOKIE)?.value; if(!token)return null;
  const admin=createAdminClient(); const {data:session}=await admin.from("participant_sessions").select("id,participant_id,expires_at,revoked_at").eq("token_hash",hashToken(token)).is("revoked_at",null).gt("expires_at",new Date().toISOString()).maybeSingle();
  if(!session)return null;
  const {data:participant}=await admin.from("participants").select("*,groups(name,whatsapp_group_link),profiles!participants_coordinator_id_fkey(name,whatsapp_number)").eq("id",session.participant_id).eq("is_active",true).is("deleted_at",null).maybeSingle();
  return participant;
}
export async function requireParticipant(){const participant=await getParticipant();if(!participant)redirect("/login");return participant;}
