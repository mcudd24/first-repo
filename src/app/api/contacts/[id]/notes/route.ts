import { NextRequest, NextResponse } from "next/server";
import { addNote } from "@/server/services/contactService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { note } = await req.json();
  if (!note || typeof note !== "string") {
    return NextResponse.json({ error: "note is required" }, { status: 400 });
  }
  await addNote(id, note);
  return NextResponse.json({ ok: true }, { status: 201 });
}
