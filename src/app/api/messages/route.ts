import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateDraft, listMessages } from "@/server/services/messageService";
import { requireUserId } from "@/server/user";

export async function GET(req: NextRequest) {
  const userId = await requireUserId();
  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  return NextResponse.json(await listMessages(userId, status));
}

const draftSchema = z.object({
  contactId: z.string(),
  purpose: z.string().min(1),
  channel: z.enum(["SMS", "EMAIL", "WHATSAPP"]).optional(),
  extraInstructions: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  const body = draftSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.message }, { status: 400 });
  }
  try {
    const message = await generateDraft(userId, body.data);
    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 }
    );
  }
}
