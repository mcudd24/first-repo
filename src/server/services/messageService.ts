import { db } from "@/server/db";
import { getAI, MessageDraftContext } from "@/server/ai";
import { detectMedicalQuestion, medicalReferralTemplate } from "@/server/ai/safety";
import { getMessaging, Channel } from "@/server/messaging";
import { parseJson } from "@/lib/json";
import { daysSince } from "@/lib/dates";
import { addTimelineEvent } from "./timelineService";
import { getSettings } from "./settingsService";

/**
 * Generates an AI draft for a contact. The draft is created with status
 * PENDING_APPROVAL — nothing is ever sent from here.
 */
export async function generateDraft(params: {
  contactId: string;
  channel?: Channel;
  purpose: string;
  extraInstructions?: string;
  source?: string;
}) {
  const contact = await db.contact.findUnique({
    where: { id: params.contactId },
    include: {
      purchases: { include: { product: true } },
      balanceTests: { orderBy: { testDate: "desc" }, take: 1 },
    },
  });
  if (!contact) throw new Error("Contact not found");

  const channel: Channel =
    params.channel ?? (contact.commPreference as Channel | null) ?? (contact.phone ? "SMS" : "EMAIL");

  const flagged =
    detectMedicalQuestion(params.purpose) ||
    detectMedicalQuestion(params.extraInstructions ?? "");

  let subject: string | null = null;
  let body: string;

  if (flagged) {
    // Safety path: never generate around a medical topic. Create a review
    // task and substitute the referral template.
    await db.reviewTask.create({
      data: {
        contactId: contact.id,
        reason: "MEDICAL_QUESTION",
        details: `Draft request flagged as medical. Purpose: "${params.purpose}"${
          params.extraInstructions ? ` / Instructions: "${params.extraInstructions}"` : ""
        }`,
      },
    });
    body = medicalReferralTemplate(contact.firstName);
  } else {
    const settings = await getSettings();
    const ctx: MessageDraftContext = {
      contactName: `${contact.firstName} ${contact.lastName}`.trim(),
      channel,
      purpose: params.purpose,
      products: contact.purchases.map((p) => p.product.name),
      interests: parseJson<string[]>(contact.interests, []),
      daysSinceLastContact: daysSince(contact.lastContactedAt),
      lastBalanceTestDate: contact.balanceTests[0]?.testDate.toISOString().slice(0, 10) ?? null,
      extraInstructions: params.extraInstructions,
      senderName: settings.partnerName || undefined,
    };
    const draft = await getAI().draftMessage(ctx);
    subject = draft.subject;
    body = draft.body;
    if (channel === "EMAIL" && settings.emailSignature) {
      body = `${body}\n\n${settings.emailSignature}`;
    }
  }

  return db.message.create({
    data: {
      contactId: contact.id,
      channel,
      subject,
      body,
      status: "PENDING_APPROVAL",
      aiGenerated: true,
      source: params.source ?? "manual",
    },
    include: { contact: true },
  });
}

export async function listMessages(status?: string) {
  return db.message.findMany({
    where: status ? { status } : undefined,
    include: { contact: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateMessageBody(id: string, body: string, subject?: string | null) {
  const message = await db.message.findUnique({ where: { id } });
  if (!message) throw new Error("Message not found");
  if (message.status === "SENT") throw new Error("Cannot edit a sent message");
  return db.message.update({
    where: { id },
    data: { body, ...(subject !== undefined && { subject }) },
  });
}

export async function rejectMessage(id: string) {
  return db.message.update({ where: { id }, data: { status: "REJECTED" } });
}

/**
 * THE approval gate. The only code path in the system that transitions a
 * message to SENT, and it is only reachable from a user-initiated API call.
 */
export async function approveAndSend(id: string) {
  const message = await db.message.findUnique({ where: { id }, include: { contact: true } });
  if (!message) throw new Error("Message not found");
  if (message.status !== "PENDING_APPROVAL" && message.status !== "DRAFT") {
    throw new Error(`Cannot send a message in status ${message.status}`);
  }

  const to =
    message.channel === "EMAIL" ? message.contact.email : message.contact.phone;
  if (!to) {
    throw new Error(
      `Contact has no ${message.channel === "EMAIL" ? "email address" : "phone number"}`
    );
  }

  const result = await getMessaging().send({
    channel: message.channel as Channel,
    to,
    subject: message.subject,
    body: message.body,
  });
  if (!result.ok) throw new Error(result.error ?? "Send failed");

  const sentAt = new Date();
  const [updated] = await db.$transaction([
    db.message.update({ where: { id }, data: { status: "SENT", sentAt } }),
    db.contact.update({
      where: { id: message.contactId },
      data: { lastContactedAt: sentAt },
    }),
  ]);

  await addTimelineEvent(
    message.contactId,
    "MESSAGE_SENT",
    `${message.channel} sent`,
    message.body.slice(0, 200)
  );

  return updated;
}
