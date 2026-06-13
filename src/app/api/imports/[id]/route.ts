import { NextRequest, NextResponse } from "next/server";
import { approveImport, rejectImport } from "@/server/services/importService";
import { requireUserId } from "@/server/user";

// POST { action: "approve", contacts: ExtractedContact[] } | { action: "reject" }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const body = await req.json();

  try {
    if (body.action === "approve") {
      const created = await approveImport(userId, id, body.contacts ?? []);
      return NextResponse.json({ ok: true, created: created.length });
    }
    if (body.action === "reject") {
      await rejectImport(userId, id);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 }
    );
  }
}
