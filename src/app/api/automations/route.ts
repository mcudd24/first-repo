import { NextRequest, NextResponse } from "next/server";
import { listAutomations, updateAutomation } from "@/server/services/automationService";
import { requireUserId } from "@/server/user";

export async function GET() {
  const userId = await requireUserId();
  return NextResponse.json(await listAutomations(userId));
}

// PATCH { id, enabled?, config? }
export async function PATCH(req: NextRequest) {
  const userId = await requireUserId();
  const { id, enabled, config } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const automation = await updateAutomation(userId, id, { enabled, config });
    return NextResponse.json(automation);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 404 }
    );
  }
}
