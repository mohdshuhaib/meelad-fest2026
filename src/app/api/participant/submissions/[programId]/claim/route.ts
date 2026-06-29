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
    .select("id,form_opened_at,verification_status,programs(global_status)")
    .eq("participant_id", p.id)
    .eq("program_id", programId)
    .maybeSingle();
  const program = Array.isArray(s?.programs) ? s.programs[0] : s?.programs;
  const resubmissionAllowed = s?.verification_status === "resubmission_required";
  if (program?.global_status !== "ongoing" && !resubmissionAllowed)
    return NextResponse.json(
      { message: "Submissions are accepted only while this programme is ongoing." },
      { status: 409 },
    );
  if (!s?.form_opened_at)
    return NextResponse.json(
      { message: "Open the submission form before marking it submitted." },
      { status: 409 },
    );
  if (
    !["not_submitted", "rejected", "resubmission_required"].includes(
      s.verification_status,
    )
  )
    return NextResponse.json(
      { message: "This submission cannot be changed in its current status." },
      { status: 409 },
    );
  const { error } = await admin
    .from("participant_programs")
    .update({
      participant_progress_status: "claimed_submitted",
      verification_status: "pending_verification",
      claimed_submitted_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", s.id);
  if (error)
    return NextResponse.json(
      { message: "Submission status could not be updated." },
      { status: 500 },
    );
  return NextResponse.json({ ok: true });
}
