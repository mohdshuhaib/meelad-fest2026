import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { createHash, randomUUID } from "crypto";
import { headers } from "next/headers";
import { DUPLICATE_MESSAGE } from "@/lib/constants";
import {
  createAccessCode,
  createRegistrationId,
  getAgeAndCategory,
  registrationSchema,
} from "@/lib/registration";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const requestHeaders = await headers();
    const ip = (requestHeaders.get("x-forwarded-for") ?? "unknown").split(",")[0];
    const identifierHash = createHash("sha256").update(`registration:${ip}`).digest("hex");
    const since = new Date(Date.now() - 60 * 60_000).toISOString();
    const { count: recentAttempts } = await supabase.from("public_request_events").select("id", { count: "exact", head: true }).eq("event_type", "registration").eq("identifier_hash", identifierHash).gte("created_at", since);
    if ((recentAttempts ?? 0) >= 10) return NextResponse.json({ message: "Too many registration attempts. Please try again later." }, { status: 429, headers: { "retry-after": "3600" } });
    await supabase.from("public_request_events").insert({ event_type: "registration", identifier_hash: identifierHash });
    const parsed = registrationSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        {
          message: "Please correct the highlighted fields.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    const input = parsed.data;
    const { data: settings } = await supabase
      .from("app_settings")
      .select(
        "registration_enabled,registration_open_at,registration_close_at,minimum_age",
      )
      .eq("id", true)
      .maybeSingle();
    const now = new Date();
    if (
      settings &&
      (!settings.registration_enabled ||
        (settings.registration_open_at &&
          now < new Date(settings.registration_open_at)) ||
        (settings.registration_close_at &&
          now > new Date(settings.registration_close_at)))
    )
      return NextResponse.json(
        { message: "Registration is currently closed." },
        { status: 403 },
      );
    const { data: duplicate } = await supabase
      .from("participants")
      .select("id")
      .eq("name", input.name)
      .eq("date_of_birth", input.dateOfBirth)
      .eq("whatsapp_number", input.whatsappNumber)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    if (duplicate)
      return NextResponse.json({ message: DUPLICATE_MESSAGE }, { status: 409 });
    const { age, category } = getAgeAndCategory(input.dateOfBirth, now);
    const accessCode = createAccessCode();
    const accessCodeHash = await hash(accessCode, 12);
    let registrationId = "";
    let inserted: null | { registration_id: string; registered_at: string } =
      null;
    for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
      registrationId = createRegistrationId(input.gender, category);
      const { data, error } = await supabase
        .from("participants")
        .insert({
          registration_id: registrationId,
          access_code_hash: accessCodeHash,
          name: input.name,
          place: input.place,
          district: input.district,
          date_of_birth: input.dateOfBirth,
          age_at_registration: age,
          gender: input.gender,
          category,
          whatsapp_number: input.whatsappNumber,
          phone_number: input.phoneNumber,
          registered_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .select("registration_id,registered_at")
        .single();
      if (!error) inserted = data;
      else if (error.code !== "23505") throw error;
    }
    if (!inserted) throw new Error("Could not allocate a registration ID");
    return NextResponse.json(
      {
        token: randomUUID(),
        registrationId: inserted.registration_id,
        accessCode,
        name: input.name,
        category,
        registeredAt: inserted.registered_at,
      },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "Registration failed",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.json(
      { message: "Registration could not be completed. Please try again." },
      { status: 500 },
    );
  }
}
