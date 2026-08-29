import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffApi } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  allPending: z.boolean().optional(),
  verificationStatus: z.enum(["verified", "rejected", "resubmission_required"]).default("verified"),
  reason: z.string().trim().max(1000).optional(),
}).superRefine((data, ctx) => {
  if (!data.allPending && (!data.ids || data.ids.length === 0)) {
    ctx.addIssue({
      code: "custom",
      path: ["ids"],
      message: "Please select at least one submission to update.",
    });
  }
  if (data.verificationStatus !== "verified" && (!data.reason || data.reason.trim().length < 5)) {
    ctx.addIssue({
      code: "custom",
      path: ["reason"],
      message: "A reason of at least 5 characters is required when rejecting or requesting resubmission.",
    });
  }
});

export async function POST(request: Request) {
  const staff = await requireStaffApi("admin");
  if (!staff) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bulkSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid bulk update request." },
      { status: 400 }
    );
  }

  const { ids, allPending, verificationStatus, reason } = parsed.data;
  const db = createAdminClient();
  const now = new Date().toISOString();
  const isVerified = verificationStatus === "verified";

  const updatePayload: Record<string, any> = {
    verification_status: verificationStatus,
    verified_at: isVerified ? now : null,
    verified_by: staff.profile.id,
    rejected_at: isVerified ? null : now,
    rejection_reason: isVerified ? null : reason,
    admin_note: reason ? reason : null,
    updated_at: now,
  };

  let query = db.from("participant_programs").update(updatePayload);

  if (allPending) {
    query = query.eq("verification_status", "pending_verification");
  } else if (ids && ids.length > 0) {
    query = query.in("id", ids);
  }

  const { data, error } = await query.select("id");

  if (error) {
    return NextResponse.json(
      { message: "Bulk update could not be completed: " + error.message },
      { status: 500 }
    );
  }

  const updatedCount = data?.length ?? 0;

  // Log audit
  await db.from("audit_logs").insert({
    actor_user_id: staff.user.id,
    actor_role: "admin",
    action: `submission.bulk_${verificationStatus}`,
    entity_type: "participant_program",
    entity_id: allPending ? "all_pending" : ids?.join(","),
    new_data: { count: updatedCount, verificationStatus, allPending },
  });

  return NextResponse.json({
    ok: true,
    count: updatedCount,
    message: `Successfully updated ${updatedCount} submissions to '${verificationStatus}'.`,
  });
}
