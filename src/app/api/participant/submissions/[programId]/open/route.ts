import { NextResponse } from "next/server";
import { getParticipant } from "@/lib/participant-session";
import { createAdminClient } from "@/lib/supabase/admin";
export async function POST(
  _: Request,
  { params }: { params: Promise<{ programId: string }> },
) {
  const p = await getParticipant();
  if (!p)
    return NextResponse.json({ message: "Session expired." }, { status: 401 });
  const { programId } = await params;
  const admin = createAdminClient();
  const { data: s } = await admin
    .from("participant_programs")
    .select(
      "id,participant_progress_status,verification_status,programs(submission_form_url,registration_id_entry_key,full_name_entry_key,global_status)",
    )
    .eq("participant_id", p.id)
    .eq("program_id", programId)
    .maybeSingle();
  const program = Array.isArray(s?.programs) ? s.programs[0] : s?.programs;
  const resubmissionAllowed = s?.verification_status === "resubmission_required";
  if (program?.global_status !== "ongoing" && !resubmissionAllowed)
    return NextResponse.json(
      { message: "Submissions are available only while this programme is ongoing." },
      { status: 409 },
    );
  if (!s || !program?.submission_form_url)
    return NextResponse.json(
      { message: "Submission form is not configured for this programme." },
      { status: 404 },
    );
  const url = new URL(program.submission_form_url);
  if (program.registration_id_entry_key)
    url.searchParams.set(
      `entry.${program.registration_id_entry_key}`,
      p.registration_id,
    );
  if (program.full_name_entry_key)
    url.searchParams.set(`entry.${program.full_name_entry_key}`, p.name);
  const now = new Date().toISOString();
  const update: Record<string, string> = { form_opened_at: now };
  if (
    s.participant_progress_status === "not_started" ||
    ["rejected", "resubmission_required"].includes(s.verification_status)
  )
    update.participant_progress_status = "ongoing";
  await admin.from("participant_programs").update(update).eq("id", s.id);
  return NextResponse.json({ url: url.toString() });
}
