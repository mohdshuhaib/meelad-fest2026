import { NextResponse } from "next/server";
import { getParticipant } from "@/lib/participant-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { isBookTestProgram } from "@/lib/program-rules";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const participant = await getParticipant();
  if (!participant) {
    return NextResponse.json(
      { message: "Authentication required to read this book." },
      { status: 401 }
    );
  }

  const { code } = await params;
  const programCode = (code || "FS001").toUpperCase().trim();

  // Verify participant eligibility & registration for this programme
  const db = createAdminClient();
  const { data: selection } = await db
    .from("participant_programs")
    .select("id, programs(code, name)")
    .eq("participant_id", participant.id);

  const isEnrolled = (selection ?? []).some((s) => {
    const prog = Array.isArray(s.programs) ? s.programs[0] : s.programs;
    if (!prog) return false;
    return prog.code.toUpperCase() === programCode || isBookTestProgram(prog);
  });

  if (!isEnrolled) {
    return NextResponse.json(
      {
        message:
          "Access Restricted: Only participants registered for this Book Test programme can view this book.",
      },
      { status: 403 }
    );
  }

  // Candidate file paths in order of preference
  const cwd = process.cwd();
  const candidatePaths = [
    path.join(cwd, "private_assets", "books", `${programCode.toLowerCase()}-book.pdf`),
    path.join(cwd, "private_assets", "books", "fs001-book.pdf"),
    path.join(cwd, "private_assets", "books", "book-test.pdf"),
    path.join(cwd, "private_assets", "books", "book.pdf"),
    path.join(cwd, "public", "books", `${programCode.toLowerCase()}-book.pdf`),
    path.join(cwd, "public", "books", "fs001-book.pdf"),
    path.join(cwd, "public", "books", "book-test.pdf"),
    path.join(cwd, "public", "books", "book.pdf"),
  ];

  let foundPath: string | null = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      foundPath = p;
      break;
    }
  }

  if (!foundPath) {
    return NextResponse.json(
      {
        message:
          "The Book PDF has not been uploaded to the server yet. Please contact the organizers.",
        hint: `Place the PDF file at: private_assets/books/fs001-book.pdf or public/books/fs001-book.pdf`,
      },
      { status: 404 }
    );
  }

  try {
    const fileBuffer = await fs.promises.readFile(foundPath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="fs001-book.pdf"`,
        "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Could not stream the book PDF." },
      { status: 500 }
    );
  }
}
