import { NextResponse } from "next/server";
import { getParticipant } from "@/lib/participant-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSwalathProgram } from "@/lib/program-rules";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ programId: string }> }
) {
  const p = await getParticipant();
  if (!p) {
    return NextResponse.json({ message: "Session expired." }, { status: 401 });
  }

  const { programId } = await params;
  const admin = createAdminClient();

  const { data: s } = await admin
    .from("participant_programs")
    .select(
      "id, participant_progress_status, verification_status, programs(id, code, name, global_status, is_swalath_campaign, campaign_start_date, campaign_end_date)"
    )
    .eq("participant_id", p.id)
    .eq("program_id", programId)
    .maybeSingle();

  if (!s) {
    return NextResponse.json(
      { message: "Programme selection not found." },
      { status: 404 }
    );
  }

  const program = Array.isArray(s.programs) ? s.programs[0] : s.programs;
  if (!program || !isSwalathProgram(program)) {
    return NextResponse.json(
      { message: "This programme does not support daily swalath entry." },
      { status: 400 }
    );
  }

  const isOngoing = program.global_status === "ongoing";
  const resubmissionAllowed = ["rejected", "resubmission_required"].includes(
    s.verification_status
  );

  if (!isOngoing && !resubmissionAllowed) {
    return NextResponse.json(
      { message: "Daily entries can only be updated while the programme is ongoing." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const rawEntries = body.entries || {};

  // Clean and validate entries
  const cleanedEntries: Record<string, number> = {};
  let totalCount = 0;

  for (const [dateKey, countVal] of Object.entries(rawEntries)) {
    // Only accept YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;

    const num = Math.max(0, Math.floor(Number(countVal) || 0));
    if (num > 0) {
      cleanedEntries[dateKey] = num;
      totalCount += num;
    }
  }

  const now = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    swalath_entries: cleanedEntries,
    swalath_total: totalCount,
    updated_at: now,
  };

  if (totalCount > 0) {
    updatePayload.participant_progress_status = "claimed_submitted";
    if (s.verification_status !== "verified") {
      updatePayload.verification_status = "pending_verification";
    }
    updatePayload.claimed_submitted_at = now;
  } else {
    if (s.participant_progress_status === "not_started") {
      updatePayload.participant_progress_status = "ongoing";
    }
  }

  const { error } = await admin
    .from("participant_programs")
    .update(updatePayload)
    .eq("id", s.id);

  if (error) {
    return NextResponse.json(
      { message: "Failed to save swalath counts. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    total: totalCount,
    entries: cleanedEntries,
    message: "Swalath counts saved successfully!",
  });
}
