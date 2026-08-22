import { NextResponse } from "next/server"; import { programSchema } from "@/lib/admin-schemas"; import { requireStaffApi } from "@/lib/staff-auth"; import { createAdminClient } from "@/lib/supabase/admin";
export async function POST(request: Request) {
  const staff = await requireStaffApi("admin");
  if (!staff) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const parsed = programSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid programme details." },
      { status: 400 }
    );
  const input = parsed.data;
  const isSwalath =
    input.is_swalath_campaign ??
    (input.code === "FSS001" || input.name.toUpperCase().includes("SWALATH"));
  const db = createAdminClient();
  const { data, error } = await db
    .from("programs")
    .insert({
      ...input,
      description: input.description || null,
      rules: input.rules || null,
      submission_form_url: isSwalath ? null : input.submission_form_url || null,
      registration_id_entry_key: isSwalath ? null : input.registration_id_entry_key || null,
      full_name_entry_key: isSwalath ? null : input.full_name_entry_key || null,
      is_swalath_campaign: isSwalath,
      campaign_start_date: input.campaign_start_date || (isSwalath ? "2026-08-22" : null),
      campaign_end_date: input.campaign_end_date || (isSwalath ? "2026-09-05" : null),
    })
    .select()
    .single();
  if (error)
    return NextResponse.json(
      {
        message:
          error.code === "23505"
            ? "A programme with this code already exists."
            : "Programme could not be created.",
      },
      { status: 409 }
    );
  await db.from("audit_logs").insert({
    actor_user_id: staff.user.id,
    actor_role: "admin",
    action: "program.created",
    entity_type: "program",
    entity_id: data.id,
    new_data: data,
  });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
