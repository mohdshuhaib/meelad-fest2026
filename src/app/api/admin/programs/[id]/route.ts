import { NextResponse } from "next/server";
import { z } from "zod";
import { programEditableSchema } from "@/lib/admin-schemas";
import { requireStaffApi } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const idSchema=z.string().uuid();

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const staff=await requireStaffApi("admin");
  if(!staff)return NextResponse.json({message:"Unauthorized"},{status:401});
  const {id}=await params;
  if(!idSchema.safeParse(id).success)return NextResponse.json({message:"Invalid programme."},{status:400});
  const parsed=programEditableSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({message:parsed.error.issues[0]?.message??"Invalid programme details."},{status:400});
  const db=createAdminClient();
  const {data:old}=await db.from("programs").select("*").eq("id",id).maybeSingle();
  if(!old)return NextResponse.json({message:"Programme not found."},{status:404});
  const input=parsed.data;
  const isSwalath = input.is_swalath_campaign ?? (old.code === "FSS001" || (old.name && old.name.toUpperCase().includes("SWALATH")));
  const update = {
    description: input.description?.trim() || null,
    rules: input.rules?.trim() || null,
    submission_form_url: isSwalath ? null : (input.submission_form_url || null),
    registration_id_entry_key: isSwalath ? null : (input.registration_id_entry_key || null),
    full_name_entry_key: isSwalath ? null : (input.full_name_entry_key || null),
    global_status: input.global_status,
    is_swalath_campaign: isSwalath,
    campaign_start_date: input.campaign_start_date || old.campaign_start_date || "2026-08-22",
    campaign_end_date: input.campaign_end_date || old.campaign_end_date || "2026-09-05",
  };
  const {data,error}=await db.from("programs").update(update).eq("id",id).select().single();
  if(error)return NextResponse.json({message:"Programme could not be updated."},{status:500});
  await db.from("audit_logs").insert({actor_user_id:staff.user.id,actor_role:"admin",action:"program.updated",entity_type:"program",entity_id:id,old_data:old,new_data:data});
  return NextResponse.json({ok:true,program:data});
}
