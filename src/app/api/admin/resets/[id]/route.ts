import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminProfile = await requireAdmin();
  if (!adminProfile)
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: s } = await admin
    .from("participant_programs")
    .select("id, form_opened_at, participant_progress_status")
    .eq("id", id)
    .maybeSingle();

  if (!s)
    return NextResponse.json(
      { message: "Participant programme not found." },
      { status: 404 },
    );

  if (s.participant_progress_status === "claimed_submitted")
    return NextResponse.json(
      { message: "Cannot reset a programme that has already been submitted." },
      { status: 400 },
    );

  const update = {
    form_opened_at: null,
    participant_progress_status: "not_started",
  };

  await admin.from("participant_programs").update(update).eq("id", id);

  return NextResponse.json({ success: true });
}
