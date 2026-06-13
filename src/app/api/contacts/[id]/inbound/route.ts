import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logInboundMessage } from "@/server/services/messageService";
import { requireUserId } from "@/server/user";

const schema = z.object({
  channel: z.enum(["SMS", "EMAIL", "WHATSAPP"]),
  body: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.message }, { status: 400 });
  }
  try {
    const result = await logInboundMessage(userId, { contactId: id, ...body.data });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 }
    );
  }
}
