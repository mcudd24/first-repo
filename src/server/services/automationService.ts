import { addDays, subDays } from "date-fns";
import { db } from "@/server/db";
import { parseJson } from "@/lib/json";
import { isBirthdayToday } from "@/lib/dates";
import { generateDraft } from "./messageService";
import { AUTOMATION_DEFS } from "./automationDefs";

// The automation engine. Evaluates every enabled rule and PROPOSES work:
// draft messages (PENDING_APPROVAL) and reminders. It never sends anything —
// that is the whole point of MVP approval mode.

export { AUTOMATION_DEFS };

export async function ensureAutomationsSeeded(userId: string) {
  await db.automation.createMany({
    data: AUTOMATION_DEFS.map((def) => ({
      userId,
      type: def.type,
      name: def.name,
      description: def.description,
      config: JSON.stringify(def.config),
    })),
    skipDuplicates: true,
  });
}

export async function listAutomations(userId: string) {
  await ensureAutomationsSeeded(userId);
  const automations = await db.automation.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
  return automations.map((a) => ({
    ...a,
    config: parseJson<Record<string, number>>(a.config, {}),
  }));
}

export async function updateAutomation(
  userId: string,
  id: string,
  data: { enabled?: boolean; config?: Record<string, number> }
) {
  const result = await db.automation.updateMany({
    where: { id, userId },
    data: {
      ...(data.enabled !== undefined && { enabled: data.enabled }),
      ...(data.config !== undefined && { config: JSON.stringify(data.config) }),
    },
  });
  if (result.count === 0) throw new Error("Automation not found");
  return db.automation.findUnique({ where: { id } });
}

interface RunResult {
  draftsCreated: number;
  remindersCreated: number;
  details: string[];
}

/** Skip if this automation already produced output for the contact recently. */
async function recentlyHandled(
  userId: string,
  contactId: string,
  source: string,
  withinDays: number
) {
  const since = subDays(new Date(), withinDays);
  const existing = await db.message.findFirst({
    where: { userId, contactId, source, createdAt: { gte: since } },
  });
  return Boolean(existing);
}

export async function runAutomations(userId: string): Promise<RunResult> {
  await ensureAutomationsSeeded(userId);
  const automations = await db.automation.findMany({
    where: { userId, enabled: true },
  });
  const result: RunResult = { draftsCreated: 0, remindersCreated: 0, details: [] };
  const now = new Date();

  const contacts = await db.contact.findMany({
    where: { userId },
    include: {
      purchases: { include: { product: true }, orderBy: { purchasedAt: "desc" } },
      balanceTests: { orderBy: { testDate: "desc" }, take: 1 },
      reminders: { where: { status: "PENDING" } },
    },
  });

  for (const automation of automations) {
    const config = parseJson<{ days?: number }>(automation.config, {});

    for (const contact of contacts) {
      const fullName = `${contact.firstName} ${contact.lastName}`.trim();
      const quietDays = contact.lastContactedAt
        ? Math.floor((now.getTime() - contact.lastContactedAt.getTime()) / 86_400_000)
        : Infinity;

      switch (automation.type) {
        case "BIRTHDAY": {
          if (!isBirthdayToday(contact.birthday)) break;
          if (await recentlyHandled(userId, contact.id, "BIRTHDAY", 2)) break;
          await generateDraft(userId, {
            contactId: contact.id,
            purpose: "birthday greeting",
            source: "BIRTHDAY",
          });
          result.draftsCreated++;
          result.details.push(`Birthday draft for ${fullName}`);
          break;
        }

        case "FOLLOW_UP_30":
        case "FOLLOW_UP_60":
        case "FOLLOW_UP_90": {
          const days = config.days ?? 30;
          if (contact.status !== "CUSTOMER") break;
          // Window: fire once when the quiet period crosses the threshold.
          if (quietDays < days || quietDays >= days + 7) break;
          if (await recentlyHandled(userId, contact.id, automation.type, days)) break;
          await generateDraft(userId, {
            contactId: contact.id,
            purpose: `${days}-day friendly check-in on how they're doing with their products`,
            source: automation.type,
          });
          result.draftsCreated++;
          result.details.push(`${days}-day follow-up draft for ${fullName}`);
          break;
        }

        case "BALANCE_TEST_6M": {
          const lastTest = contact.balanceTests[0];
          if (!lastTest) break;
          const days = config.days ?? 180;
          const due = addDays(lastTest.testDate, days);
          if (due > now) break;
          const hasReminder = contact.reminders.some((r) => r.type === "BALANCE_TEST");
          if (hasReminder) break;
          await db.reminder.create({
            data: {
              userId,
              contactId: contact.id,
              type: "BALANCE_TEST",
              title: `${contact.firstName} is due for a BalanceTest re-test`,
              dueDate: now,
              autoGenerated: true,
            },
          });
          if (!(await recentlyHandled(userId, contact.id, "BALANCE_TEST_6M", 30))) {
            await generateDraft(userId, {
              contactId: contact.id,
              purpose: "6-month BalanceTest re-test reminder",
              source: "BALANCE_TEST_6M",
            });
            result.draftsCreated++;
          }
          result.remindersCreated++;
          result.details.push(`BalanceTest reminder for ${fullName}`);
          break;
        }

        case "REORDER": {
          const lastPurchase = contact.purchases[0];
          if (!lastPurchase) break;
          const days = config.days ?? 50;
          const due = addDays(lastPurchase.purchasedAt, days);
          if (due > now || due < subDays(now, 14)) break;
          if (await recentlyHandled(userId, contact.id, "REORDER", days)) break;
          await generateDraft(userId, {
            contactId: contact.id,
            purpose: `reorder reminder for ${lastPurchase.product.name}`,
            source: "REORDER",
          });
          result.draftsCreated++;
          result.details.push(`Reorder draft for ${fullName}`);
          break;
        }

        case "INACTIVE": {
          const days = config.days ?? 120;
          if (contact.status !== "CUSTOMER" || quietDays < days) break;
          const hasReminder = contact.reminders.some((r) => r.type === "FOLLOW_UP");
          if (hasReminder) break;
          await db.reminder.create({
            data: {
              userId,
              contactId: contact.id,
              type: "FOLLOW_UP",
              title: `Reconnect with ${contact.firstName} (inactive ${
                quietDays === Infinity ? "since import" : `${quietDays} days`
              })`,
              dueDate: now,
              autoGenerated: true,
            },
          });
          result.remindersCreated++;
          result.details.push(`Inactive reminder for ${fullName}`);
          break;
        }

        case "LEAD_NURTURE": {
          const days = config.days ?? 14;
          if (contact.status !== "LEAD" || quietDays < days) break;
          if (await recentlyHandled(userId, contact.id, "LEAD_NURTURE", days)) break;
          await generateDraft(userId, {
            contactId: contact.id,
            purpose:
              "gentle lead nurture — share enthusiasm and invite questions, absolutely no pressure",
            source: "LEAD_NURTURE",
          });
          result.draftsCreated++;
          result.details.push(`Lead nurture draft for ${fullName}`);
          break;
        }
      }
    }

    await db.automation.update({ where: { id: automation.id }, data: { lastRunAt: now } });
  }

  return result;
}
