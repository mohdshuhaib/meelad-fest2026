import { NextResponse } from "next/server"; import { clearParticipantSession } from "@/lib/participant-session";
export async function POST(request:Request){await clearParticipantSession();return NextResponse.redirect(new URL("/login",request.url),303)}
