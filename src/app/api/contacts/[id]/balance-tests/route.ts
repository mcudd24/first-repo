import { NextRequest, NextResponse } from "next/server";
import { addBalanceTest } from "@/server/services/contactService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { testDate, notes } = await req.json();
  if (!testDate || typeof testDate !== "string") {
    return NextResponse.json({ error: "testDate is required" }, { status: 400 });
  }
  const test = await addBalanceTest(id, testDate, notes);
  return NextResponse.json(test, { status: 201 });
}
