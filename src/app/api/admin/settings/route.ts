import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffApi } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  festival_name: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .transform((v) => v.toUpperCase()),
  contact_number: z.union([z.literal(""), z.string().regex(/^[6-9]\d{9}$/)]),
  registration_open_at: z.string().nullable(),
  registration_close_at: z.string().nullable(),
  program_selection_open_at: z.string().nullable(),
  program_selection_close_at: z.string().nullable(),
  registration_enabled: z.boolean(),
});

function istDateTimeToIso(value: string | null) {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    ? `${value}:00`
    : value;
  return new Date(`${normalized}+05:30`).toISOString();
}

function assertWindow(openAt: string | null, closeAt: string | null, label: string) {
  if (!openAt || !closeAt) return null;
  if (new Date(openAt) >= new Date(closeAt))
    return `${label} close date must be after the open date.`;
  return null;
}

export async function PATCH(request: Request) {
  const staff = await requireStaffApi("admin");
  if (!staff)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid settings." },
      { status: 400 },
    );
  const values = {
    ...parsed.data,
    contact_number: parsed.data.contact_number || null,
    registration_open_at: istDateTimeToIso(parsed.data.registration_open_at),
    registration_close_at: istDateTimeToIso(parsed.data.registration_close_at),
    program_selection_open_at: istDateTimeToIso(
      parsed.data.program_selection_open_at,
    ),
    program_selection_close_at: istDateTimeToIso(
      parsed.data.program_selection_close_at,
    ),
  };
  const windowError =
    assertWindow(
      values.registration_open_at,
      values.registration_close_at,
      "Registration",
    ) ||
    assertWindow(
      values.program_selection_open_at,
      values.program_selection_close_at,
      "Programme selection",
    );
  if (windowError)
    return NextResponse.json({ message: windowError }, { status: 400 });
  const db = createAdminClient();
  const { data: old } = await db
    .from("app_settings")
    .select("*")
    .eq("id", true)
    .single();
  const { data, error } = await db
    .from("app_settings")
    .update(values)
    .eq("id", true)
    .select()
    .single();
  if (error)
    return NextResponse.json(
      { message: "Settings could not be saved." },
      { status: 500 },
    );
  await db.from("audit_logs").insert({
    actor_user_id: staff.user.id,
    actor_role: "admin",
    action: "settings.updated",
    entity_type: "app_settings",
    entity_id: "singleton",
    old_data: old,
    new_data: data,
  });
  return NextResponse.json({ ok: true });
}
