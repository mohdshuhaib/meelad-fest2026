import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const adminProfile = await requireAdmin();
  if (!adminProfile)
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("app_settings")
    .select("point_rules")
    .eq("id", true)
    .single();

  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data?.point_rules || {});
}

export async function POST(req: Request) {
  const adminProfile = await requireAdmin();
  if (!adminProfile)
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const body = await req.json();
  const admin = createAdminClient();
  const { error } = await admin
    .from("app_settings")
    .update({ point_rules: body })
    .eq("id", true);

  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
