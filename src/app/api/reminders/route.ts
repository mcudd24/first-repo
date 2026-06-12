import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { addTimelineEvent } from "@/server/services/timelineService";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") ?? "PENDING";
  const reminders = await db.reminder.findMany({
    where: { status },
    include: { contact: true },
    orderBy: { dueDate: "asc" },
  });
  return NextResponse.json(reminders);
}

const createSchema = z.object({
  contactId: z.string(),
  title: z.string().min(1),
  dueDate: z.string(),
  type: z.enum(["BIRTHDAY", "FOLLOW_UP", "BALANCE_TEST", "REORDER", "CUSTOM"]).default("CUSTOM"),
});

export async function POST(req: NextRequest) {
  const body = createSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.message }, { status: 400 });
  }
  const reminder = await db.reminder.create({
    data: {
      contactId: body.data.contactId,
      title: body.data.title,
      dueDate: new Date(body.data.dueDate),
      type: body.data.type,
    },
  });
  await addTimelineEvent(body.data.contactId, "REMINDER_CREATED", body.data.title);
  return NextResponse.json(reminder, { status: 201 });
}

// PATCH { id, status: "DONE" | "DISMISSED" }
export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();
  if (!id || !["DONE", "DISMISSED"].includes(status)) {
    return NextResponse.json({ error: "id and valid status required" }, { status: 400 });
  }
  const reminder = await db.reminder.update({
    where: { id },
    data: { status, completedAt: new Date() },
  });
  return NextResponse.json(reminder);
}
