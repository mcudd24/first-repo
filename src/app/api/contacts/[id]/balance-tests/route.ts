import { NextRequest, NextResponse } from "next/server";
import { addBalanceTest } from "@/server/services/contactService";
import { requireUserId } from "@/server/user";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const { testDate, notes } = await req.json();
  if (!testDate || typeof testDate !== "string") {
    return NextResponse.json({ error: "testDate is required" }, { status: 400 });
  }
  try {
    const test = await addBalanceTest(userId, id, testDate, notes);
    return NextResponse.json(test, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 404 }
    );
  }
}
