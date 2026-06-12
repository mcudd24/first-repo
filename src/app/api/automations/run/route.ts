import { NextRequest, NextResponse } from "next/server";
import { subHours } from "date-fns";
import { db } from "@/server/db";
import { ensureAutomationsSeeded, runAutomations } from "@/server/services/automationService";

// POST /api/automations/run        — run now (user-initiated)
// POST /api/automations/run?ifStale=1 — run only if no run in the last hour
// (the dashboard fires this in the background on load, standing in for a
//  scheduler until Phase 2)
export async function POST(req: NextRequest) {
  if (req.nextUrl.searchParams.get("ifStale")) {
    await ensureAutomationsSeeded();
    const recentRun = await db.automation.findFirst({
      where: { enabled: true, lastRunAt: { gte: subHours(new Date(), 1) } },
    });
    if (recentRun) {
      return NextResponse.json({ skipped: true, draftsCreated: 0, remindersCreated: 0, details: [] });
    }
  }
  const result = await runAutomations();
  return NextResponse.json(result);
}
