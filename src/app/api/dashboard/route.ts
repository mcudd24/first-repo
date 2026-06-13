import { NextResponse } from "next/server";
import { getDashboard } from "@/server/services/dashboardService";
import { requireUserId } from "@/server/user";

export async function GET() {
  const userId = await requireUserId();
  return NextResponse.json(await getDashboard(userId));
}
