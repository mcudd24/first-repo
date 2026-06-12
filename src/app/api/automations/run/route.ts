import { NextResponse } from "next/server";
import { runAutomations } from "@/server/services/automationService";

export async function POST() {
  const result = await runAutomations();
  return NextResponse.json(result);
}
