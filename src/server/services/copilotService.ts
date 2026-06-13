import { db } from "@/server/db";
import { getAI, CopilotMessage, CopilotToolDef } from "@/server/ai";
import { listContacts, ContactFilters } from "./contactService";
import { generateDraft } from "./messageService";

// The copilot proposes, never sends. Write-tools create PENDING_APPROVAL
// drafts and reminders; the UI links the user to the approval queue.

const TOOLS: CopilotToolDef[] = [
  {
    name: "search_contacts",
    description:
      "Search the partner's contacts. Call this when the user asks who matches a " +
      "condition: not contacted in N days, birthdays this month, BalanceTest due, " +
      "bought a product, name/status search.",
    input_schema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Name, email, or phone fragment" },
        status: { type: "string", enum: ["LEAD", "CUSTOMER", "INACTIVE"] },
        notContactedDays: { type: "number", description: "Only contacts not contacted in this many days" },
        birthdaysThisMonth: { type: "boolean" },
        balanceTestDue: { type: "boolean", description: "Last BalanceTest more than ~6 months ago" },
        product: { type: "string", description: "Only contacts who bought this product" },
      },
    },
  },
  {
    name: "get_due_reminders",
    description: "List pending reminders that are due now or overdue.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "draft_message",
    description:
      "Create an AI message draft for ONE contact (by id). The draft goes to the " +
      "approval queue; it is never sent automatically.",
    input_schema: {
      type: "object",
      properties: {
        contactId: { type: "string" },
        purpose: { type: "string", description: "What the message is for" },
        channel: { type: "string", enum: ["SMS", "EMAIL", "WHATSAPP"] },
      },
      required: ["contactId", "purpose"],
    },
  },
  {
    name: "draft_messages_for_segment",
    description:
      "Create AI message drafts for every contact matching a filter (e.g. all " +
      "BalanceOil customers). Drafts go to the approval queue.",
    input_schema: {
      type: "object",
      properties: {
        product: { type: ["string", "null"], description: "Filter: bought this product" },
        notContactedDays: { type: "number" },
        status: { type: "string", enum: ["LEAD", "CUSTOMER", "INACTIVE"] },
        balanceTestDue: { type: "boolean" },
        purpose: { type: "string", description: "What the messages are for" },
      },
      required: ["purpose"],
    },
  },
  {
    name: "create_reminder",
    description: "Create a reminder for a contact.",
    input_schema: {
      type: "object",
      properties: {
        contactId: { type: "string" },
        title: { type: "string" },
        dueDate: { type: "string", description: "ISO date" },
      },
      required: ["contactId", "title", "dueDate"],
    },
  },
];

export interface CopilotAction {
  type: "drafts_created" | "reminder_created";
  count: number;
  description: string;
}

function describeContacts(rows: Awaited<ReturnType<typeof listContacts>>): string {
  if (rows.length === 0) return "No contacts match.";
  return rows
    .slice(0, 25)
    .map(
      (c) =>
        `- ${c.firstName} ${c.lastName} (${c.status.toLowerCase()})` +
        (c.daysSinceContact !== null ? ` — last contacted ${c.daysSinceContact} days ago` : " — never contacted") +
        (c.products.length ? ` — products: ${c.products.join(", ")}` : "")
    )
    .join("\n");
}

async function executeTool(
  userId: string,
  name: string,
  input: Record<string, unknown>,
  actions: CopilotAction[]
): Promise<string> {
  switch (name) {
    case "search_contacts": {
      const rows = await listContacts(userId, input as ContactFilters);
      return describeContacts(rows);
    }

    case "get_due_reminders": {
      const reminders = await db.reminder.findMany({
        where: { userId, status: "PENDING", dueDate: { lte: new Date() } },
        include: { contact: true },
        orderBy: { dueDate: "asc" },
      });
      if (reminders.length === 0) return "No reminders are due.";
      return reminders
        .map((r) => `- ${r.title} (${r.contact.firstName} ${r.contact.lastName})`)
        .join("\n");
    }

    case "draft_message": {
      const message = await generateDraft(userId, {
        contactId: String(input.contactId),
        purpose: String(input.purpose),
        channel: input.channel as "SMS" | "EMAIL" | "WHATSAPP" | undefined,
        source: "copilot",
      });
      actions.push({
        type: "drafts_created",
        count: 1,
        description: `Draft for ${message.contact.firstName} ${message.contact.lastName}`,
      });
      return `Draft created for ${message.contact.firstName} (awaiting approval): "${message.body}"`;
    }

    case "draft_messages_for_segment": {
      const filters: ContactFilters = {
        product: (input.product as string) || undefined,
        notContactedDays: input.notContactedDays as number | undefined,
        status: input.status as string | undefined,
        balanceTestDue: input.balanceTestDue as boolean | undefined,
      };
      const rows = await listContacts(userId, filters);
      const targets = rows.slice(0, 20); // sanity cap per copilot request
      for (const c of targets) {
        await generateDraft(userId, {
          contactId: c.id,
          purpose: String(input.purpose),
          source: "copilot",
        });
      }
      actions.push({
        type: "drafts_created",
        count: targets.length,
        description: `${targets.length} drafts created`,
      });
      return targets.length === 0
        ? "No contacts matched the filter — no drafts created."
        : `Created ${targets.length} drafts (awaiting approval) for: ${targets
            .map((c) => c.firstName + " " + c.lastName)
            .join(", ")}`;
    }

    case "create_reminder": {
      const contactId = String(input.contactId);
      const owned = await db.contact.findFirst({
        where: { id: contactId, userId },
        select: { id: true },
      });
      if (!owned) return `Contact ${contactId} not found.`;
      const reminder = await db.reminder.create({
        data: {
          userId,
          contactId,
          type: "CUSTOM",
          title: String(input.title),
          dueDate: new Date(String(input.dueDate)),
          autoGenerated: true,
        },
        include: { contact: true },
      });
      actions.push({
        type: "reminder_created",
        count: 1,
        description: reminder.title,
      });
      return `Reminder created: "${reminder.title}" due ${reminder.dueDate.toDateString()}`;
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

export async function copilotChat(
  userId: string,
  history: { role: "user" | "assistant"; text: string }[]
): Promise<{ reply: string; actions: CopilotAction[] }> {
  const ai = getAI();
  const actions: CopilotAction[] = [];

  const messages: CopilotMessage[] = history.map((m) => ({
    role: m.role,
    content: m.text,
  }));

  // Tool-use loop, bounded to avoid runaways.
  for (let i = 0; i < 6; i++) {
    const turn = await ai.copilotTurn(messages, TOOLS);

    if (turn.stop !== "tool_use" || turn.toolCalls.length === 0) {
      return { reply: turn.reply || "Done.", actions };
    }

    messages.push({
      role: "assistant",
      content: [
        ...(turn.reply ? [{ type: "text" as const, text: turn.reply }] : []),
        ...turn.toolCalls.map((tc) => ({
          type: "tool_use" as const,
          id: tc.id,
          name: tc.name,
          input: tc.input,
        })),
      ],
    });

    const results = [];
    for (const tc of turn.toolCalls) {
      let content: string;
      try {
        content = await executeTool(userId, tc.name, tc.input, actions);
      } catch (err) {
        content = `Error: ${err instanceof Error ? err.message : "tool failed"}`;
      }
      results.push({ type: "tool_result" as const, tool_use_id: tc.id, content });
    }
    messages.push({ role: "user", content: results });
  }

  return {
    reply: "I gathered a lot of information but hit my step limit — please narrow the request.",
    actions,
  };
}
