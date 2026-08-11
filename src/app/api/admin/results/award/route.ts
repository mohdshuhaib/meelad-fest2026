import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const adminProfile = await requireAdmin();
  if (!adminProfile)
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const body = await req.json();
  const { participant_program_id, result_grade, result_position } = body;
  
  if (!participant_program_id)
    return NextResponse.json({ message: "Missing ID." }, { status: 400 });

  const admin = createAdminClient();
  
  // 1. Get the current point rules and participant category
  const [settingsRes, ppRes] = await Promise.all([
    admin.from("app_settings").select("point_rules").eq("id", true).single(),
    admin
      .from("participant_programs")
      .select("participants(category)")
      .eq("id", participant_program_id)
      .single()
  ]);

  if (ppRes.error || !ppRes.data)
    return NextResponse.json({ message: "Participant programme not found." }, { status: 404 });

  const pointRules = settingsRes.data?.point_rules;
  const participant = Array.isArray(ppRes.data.participants) ? ppRes.data.participants[0] : ppRes.data.participants;
  const cat = participant?.category;
  const categoryType = cat === "general" ? "general" : "normal";

  // 2. Calculate points
  let points = 0;
  if (result_grade && result_grade !== "None") {
    points += pointRules[categoryType]?.grades[result_grade] || 0;
  }
  if (result_position && result_position !== "None") {
    points += pointRules[categoryType]?.positions[result_position] || 0;
  }

  // 3. Save
  const updatePayload = {
    result_grade: result_grade || "None",
    result_position: result_position || "None",
    result_points: points,
  };

  const { error } = await admin
    .from("participant_programs")
    .update(updatePayload)
    .eq("id", participant_program_id);

  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });
  
  return NextResponse.json({ success: true, points });
}
