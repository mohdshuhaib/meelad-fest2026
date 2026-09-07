import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_POINT_RULES = {
  normal: { grades: { A: 5, B: 3, C: 1 }, positions: { "1st": 5, "2nd": 3, "3rd": 1 } },
  general: { grades: { A: 10, B: 8, C: 6 }, positions: { "1st": 5, "2nd": 3, "3rd": 1 } },
};

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

  const pointRules = settingsRes.data?.point_rules || DEFAULT_POINT_RULES;
  const participant = Array.isArray(ppRes.data.participants) ? ppRes.data.participants[0] : ppRes.data.participants;
  const cat = participant?.category;
  const categoryType = cat === "general" ? "general" : "normal";

  // 2. Calculate points
  const activeRules = pointRules[categoryType] || DEFAULT_POINT_RULES[categoryType];
  let points = 0;
  if (result_grade && result_grade !== "None") {
    points += activeRules?.grades?.[result_grade] || 0;
  }
  if (result_position && result_position !== "None") {
    points += activeRules?.positions?.[result_position] || 0;
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
  
  revalidatePath("/results");
  revalidatePath("/participant");

  return NextResponse.json({ success: true, points });
}

