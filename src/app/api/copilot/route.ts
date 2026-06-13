import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { copilotChat } from "@/server/services/copilotService";
import { requireUserId } from "@/server/user";

const schema = z.object({
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string() }))
    .min(1)
    .max(40),
});

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.message }, { status: 400 });
  }
  try {
    const result = await copilotChat(userId, body.data.history);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Copilot failed" },
      { status: 500 }
    );
  }
}
