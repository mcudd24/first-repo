import { NextRequest, NextResponse } from "next/server";
import {
  approveAndSend,
  rejectMessage,
  updateMessageBody,
} from "@/server/services/messageService";

// PATCH { action: "edit", body, subject? } | { action: "approve" } | { action: "reject" }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  try {
    if (body.action === "edit") {
      return NextResponse.json(await updateMessageBody(id, body.body, body.subject));
    }
    if (body.action === "approve") {
      return NextResponse.json(await approveAndSend(id));
    }
    if (body.action === "reject") {
      return NextResponse.json(await rejectMessage(id));
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 }
    );
  }
}
