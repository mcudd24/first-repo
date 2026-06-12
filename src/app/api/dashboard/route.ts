import { NextResponse } from "next/server";
import { getDashboard } from "@/server/services/dashboardService";

export async function GET() {
  return NextResponse.json(await getDashboard());
}
