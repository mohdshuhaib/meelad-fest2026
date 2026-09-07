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
  
  // 1. Get the current point rules and program category eligibility
  const [settingsRes, ppRes] = await Promise.all([
    admin.from("app_settings").select("point_rules").eq("id", true).maybeSingle(),
    admin
      .from("participant_programs")
      .select("id, program_id, programs(category_eligibility), participants(category)")
      .eq("id", participant_program_id)
      .maybeSingle()
  ]);

  if (ppRes.error || !ppRes.data)
    return NextResponse.json({ message: "Participant programme not found." }, { status: 404 });

  const pointRules = settingsRes.data?.point_rules || DEFAULT_POINT_RULES;
  const program = Array.isArray(ppRes.data.programs) ? ppRes.data.programs[0] : ppRes.data.programs;
  const categoryType = program?.category_eligibility === "general" ? "general" : "normal";

  // 2. Calculate points
  const activeRules = pointRules?.[categoryType] || DEFAULT_POINT_RULES[categoryType];
  let points = 0;
  if (result_grade && result_grade !== "None") {
    const gVal = activeRules?.grades?.[result_grade];
    points += typeof gVal === "number" ? gVal : (DEFAULT_POINT_RULES[categoryType].grades as Record<string, number>)[result_grade] || 0;
  }
  if (result_position && result_position !== "None") {
    const pVal = activeRules?.positions?.[result_position];
    points += typeof pVal === "number" ? pVal : (DEFAULT_POINT_RULES[categoryType].positions as Record<string, number>)[result_position] || 0;
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
  revalidatePath("/admin/results");
  revalidatePath("/participant");

  return NextResponse.json({ success: true, points });
}
