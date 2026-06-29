import { NextResponse } from "next/server"; import { createStaffClient } from "@/lib/supabase/server";
export async function POST(request:Request){await (await createStaffClient()).auth.signOut({scope:"local"});return NextResponse.redirect(new URL("/staff/login",request.url),303)}
