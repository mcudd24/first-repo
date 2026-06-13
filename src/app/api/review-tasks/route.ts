import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  const tasks = await db.reviewTask.findMany({
    where: { status: "OPEN" },
    include: { contact: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tasks);
}

// PATCH { id, action: "resolve" }
export async function PATCH(req: NextRequest) {
  const { id, action } = await req.json();
  if (!id || action !== "resolve") {
    return NextResponse.json({ error: "id and action: 'resolve' required" }, { status: 400 });
  }
  const task = await db.reviewTask.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
  return NextResponse.json(task);
}
