import { NextRequest, NextResponse } from "next/server";
import { listAutomations, updateAutomation } from "@/server/services/automationService";

export async function GET() {
  return NextResponse.json(await listAutomations());
}

// PATCH { id, enabled?, config? }
export async function PATCH(req: NextRequest) {
  const { id, enabled, config } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const automation = await updateAutomation(id, { enabled, config });
  return NextResponse.json(automation);
}
