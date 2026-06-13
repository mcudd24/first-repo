import { db } from "@/server/db";

export type TimelineEventType =
  | "IMPORTED"
  | "NOTE"
  | "MESSAGE_SENT"
  | "MESSAGE_RECEIVED"
  | "PURCHASE"
  | "BALANCE_TEST"
  | "REMINDER_CREATED"
  | "AI_SUGGESTION"
  | "STATUS_CHANGE";

export async function addTimelineEvent(
  userId: string,
  contactId: string,
  type: TimelineEventType,
  title: string,
  description?: string,
  occurredAt?: Date
) {
  return db.timelineEvent.create({
    data: {
      userId,
      contactId,
      type,
      title,
      description,
      occurredAt: occurredAt ?? new Date(),
    },
  });
}
