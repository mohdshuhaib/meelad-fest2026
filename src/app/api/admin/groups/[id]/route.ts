import { NextResponse } from "next/server";
import { z } from "zod";
import { groupSchema } from "@/lib/admin-schemas";
import { requireStaffApi } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const idSchema = z.string().uuid();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await requireStaffApi("admin");
  if (!staff) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ message: "Invalid group." }, { status: 400 });
  }

  const parsed = groupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid group details." },
      { status: 400 },
    );
  }

  const db = createAdminClient();

  const { data: old } = await db.from("groups").select("*").eq("id", id).maybeSingle();
  if (!old) {
    return NextResponse.json({ message: "Group not found." }, { status: 404 });
  }

  const input = parsed.data;
  const update = {
    name: input.name,
    whatsapp_group_link: input.whatsappGroupLink || null,
  };

  const { data, error } = await db
    .from("groups")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      {
        message:
          error.code === "23505"
            ? "That group name already exists."
            : "Group could not be updated.",
      },
      { status: error.code === "23505" ? 409 : 500 },
    );
  }

  await db.from("audit_logs").insert({
    actor_user_id: staff.user.id,
    actor_role: "admin",
    action: "group.updated",
    entity_type: "group",
    entity_id: id,
    old_data: old,
    new_data: data,
  });

  return NextResponse.json({ ok: true, group: data });
}
