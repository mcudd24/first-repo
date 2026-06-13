import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { requireUserId } from "@/server/user";

export async function GET() {
  const userId = await requireUserId();
  const tasks = await db.reviewTask.findMany({
    where: { userId, status: "OPEN" },
    include: { contact: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tasks);
}

// PATCH { id, action: "resolve" }
export async function PATCH(req: NextRequest) {
  const userId = await requireUserId();
  const { id, action } = await req.json();
  if (!id || action !== "resolve") {
    return NextResponse.json({ error: "id and action: 'resolve' required" }, { status: 400 });
  }
  const result = await db.reviewTask.updateMany({
    where: { id, userId },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Review task not found" }, { status: 404 });
  }
  return NextResponse.json(await db.reviewTask.findUnique({ where: { id } }));
}
