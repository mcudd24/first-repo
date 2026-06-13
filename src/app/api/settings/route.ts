import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSettings, updateSettings } from "@/server/services/settingsService";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({
    ...settings,
    aiProvider: process.env.ANTHROPIC_API_KEY ? "claude" : "mock",
    aiModel: process.env.ANTHROPIC_API_KEY
      ? process.env.AI_MODEL || "claude-opus-4-8"
      : null,
  });
}

const patchSchema = z.object({
  partnerName: z.string().max(120).optional(),
  emailSignature: z.string().max(1000).optional(),
});

export async function PATCH(req: NextRequest) {
  const body = patchSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.message }, { status: 400 });
  }
  return NextResponse.json(await updateSettings(body.data));
}
