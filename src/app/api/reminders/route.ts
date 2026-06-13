import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { addTimelineEvent } from "@/server/services/timelineService";
import { requireUserId } from "@/server/user";

export async function GET(req: NextRequest) {
  const userId = await requireUserId();
  const status = req.nextUrl.searchParams.get("status") ?? "PENDING";
  const reminders = await db.reminder.findMany({
    where: { userId, status },
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
  const userId = await requireUserId();
  const body = createSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.message }, { status: 400 });
  }
  // Authorize: contact must belong to the user.
  const owned = await db.contact.findFirst({
    where: { id: body.data.contactId, userId },
    select: { id: true },
  });
  if (!owned) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }
  const reminder = await db.reminder.create({
    data: {
      userId,
      contactId: body.data.contactId,
      title: body.data.title,
      dueDate: new Date(body.data.dueDate),
      type: body.data.type,
    },
  });
  await addTimelineEvent(
    userId,
    body.data.contactId,
    "REMINDER_CREATED",
    body.data.title
  );
  return NextResponse.json(reminder, { status: 201 });
}

// PATCH { id, status: "DONE" | "DISMISSED" }
export async function PATCH(req: NextRequest) {
  const userId = await requireUserId();
  const { id, status } = await req.json();
  if (!id || !["DONE", "DISMISSED"].includes(status)) {
    return NextResponse.json({ error: "id and valid status required" }, { status: 400 });
  }
  const result = await db.reminder.updateMany({
    where: { id, userId },
    data: { status, completedAt: new Date() },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
  }
  return NextResponse.json(await db.reminder.findUnique({ where: { id } }));
}
