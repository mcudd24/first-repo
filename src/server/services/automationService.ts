import { addDays, subDays } from "date-fns";
import { db } from "@/server/db";
import { parseJson } from "@/lib/json";
import { isBirthdayToday } from "@/lib/dates";
import { generateDraft } from "./messageService";

// The automation engine. Evaluates every enabled rule and PROPOSES work:
// draft messages (PENDING_APPROVAL) and reminders. It never sends anything —
// that is the whole point of MVP approval mode.

export const AUTOMATION_DEFS = [
  { type: "BIRTHDAY", name: "Birthday greetings", description: "Draft a birthday message on each contact's birthday.", config: {} },
  { type: "FOLLOW_UP_30", name: "30-day follow-up", description: "Draft a check-in 30 days after last contact.", config: { days: 30 } },
  { type: "FOLLOW_UP_60", name: "60-day follow-up", description: "Draft a check-in 60 days after last contact.", config: { days: 60 } },
  { type: "FOLLOW_UP_90", name: "90-day follow-up", description: "Draft a check-in 90 days after last contact.", config: { days: 90 } },
  { type: "BALANCE_TEST_6M", name: "6-month BalanceTest reminder", description: "Remind customers ~6 months after their last BalanceTest.", config: { days: 180 } },
  { type: "REORDER", name: "Product reorder reminder", description: "Draft a reorder nudge ~50 days after a purchase.", config: { days: 50 } },
  { type: "INACTIVE", name: "Inactive customer reminder", description: "Flag customers with no contact for 120+ days.", config: { days: 120 } },
  { type: "LEAD_NURTURE", name: "Lead nurture campaign", description: "Draft a gentle nurture message for leads after 14 quiet days.", config: { days: 14 } },
] as const;

export async function ensureAutomationsSeeded() {
  for (const def of AUTOMATION_DEFS) {
    await db.automation.upsert({
      where: { type: def.type },
      create: {
        type: def.type,
        name: def.name,
        description: def.description,
        config: JSON.stringify(def.config),
      },
      update: {},
    });
  }
}

export async function listAutomations() {
  await ensureAutomationsSeeded();
  const automations = await db.automation.findMany({ orderBy: { name: "asc" } });
  return automations.map((a) => ({ ...a, config: parseJson<Record<string, number>>(a.config, {}) }));
}

export async function updateAutomation(
  id: string,
  data: { enabled?: boolean; config?: Record<string, number> }
) {
  return db.automation.update({
    where: { id },
    data: {
      ...(data.enabled !== undefined && { enabled: data.enabled }),
      ...(data.config !== undefined && { config: JSON.stringify(data.config) }),
    },
  });
}

interface RunResult {
  draftsCreated: number;
  remindersCreated: number;
  details: string[];
}

/** Skip if this automation already produced output for the contact recently. */
async function recentlyHandled(contactId: string, source: string, withinDays: number) {
  const since = subDays(new Date(), withinDays);
  const existing = await db.message.findFirst({
    where: { contactId, source, createdAt: { gte: since } },
  });
  return Boolean(existing);
}

export async function runAutomations(): Promise<RunResult> {
  await ensureAutomationsSeeded();
  const automations = await db.automation.findMany({ where: { enabled: true } });
  const result: RunResult = { draftsCreated: 0, remindersCreated: 0, details: [] };
  const now = new Date();

  const contacts = await db.contact.findMany({
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
          if (await recentlyHandled(contact.id, "BIRTHDAY", 2)) break;
          await generateDraft({
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
          if (await recentlyHandled(contact.id, automation.type, days)) break;
          await generateDraft({
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
              contactId: contact.id,
              type: "BALANCE_TEST",
              title: `${contact.firstName} is due for a BalanceTest re-test`,
              dueDate: now,
              autoGenerated: true,
            },
          });
          if (!(await recentlyHandled(contact.id, "BALANCE_TEST_6M", 30))) {
            await generateDraft({
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
          if (await recentlyHandled(contact.id, "REORDER", days)) break;
          await generateDraft({
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
          if (await recentlyHandled(contact.id, "LEAD_NURTURE", days)) break;
          await generateDraft({
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
