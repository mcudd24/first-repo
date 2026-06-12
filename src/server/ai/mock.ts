// Deterministic AI provider used when no ANTHROPIC_API_KEY is configured.
// Keeps every feature fully demoable offline. Outputs are realistic but
// clearly rule-based — no network calls, no nondeterminism.

import {
  AIProvider,
  ContactSnapshot,
  CopilotMessage,
  CopilotToolDef,
  CopilotTurnResult,
  ExtractedContact,
  ExtractionInput,
  MessageDraft,
  MessageDraftContext,
} from "./types";

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/g;
const DATE_RE = /\b(\d{4}-\d{2}-\d{2})\b/;
const KNOWN_PRODUCTS = ["BalanceOil+", "BalanceOil", "ZinoBiotic+", "Xtend", "Protect+", "Viva+"];

export class MockProvider implements AIProvider {
  readonly name = "mock";

  async extractContacts(input: ExtractionInput): Promise<ExtractedContact[]> {
    const text = input.text?.trim();
    if (!text) {
      // File-only input: return an instructive placeholder the user edits in review.
      return [
        {
          firstName: "Scanned",
          lastName: "Contact",
          email: null,
          phone: null,
          address: null,
          birthday: null,
          products: [],
          balanceTestDate: null,
          notes:
            "Demo mode: file contents can't be read without an AI API key. " +
            "Edit this entry before approving, or set ANTHROPIC_API_KEY.",
          interests: [],
          commPreference: null,
        },
      ];
    }

    // Split on blank lines: each block is treated as one person.
    const blocks = text.split(/\n\s*\n/).filter((b) => b.trim().length > 0);
    return blocks.map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const email = block.match(EMAIL_RE)?.[0] ?? null;
      const phone = block.match(PHONE_RE)?.[0]?.trim() ?? null;
      const date = block.match(DATE_RE)?.[1] ?? null;
      const products = KNOWN_PRODUCTS.filter((p) =>
        block.toLowerCase().includes(p.toLowerCase())
      );
      // First line that isn't an email/phone is assumed to be the name.
      const nameLine =
        lines.find((l) => !EMAIL_RE.test(l) && !/\d{4}/.test(l) && l.split(" ").length <= 4) ??
        "Unknown Contact";
      const [firstName, ...rest] = nameLine.replace(/^name:\s*/i, "").split(/\s+/);
      return {
        firstName: firstName || "Unknown",
        lastName: rest.join(" "),
        email,
        phone,
        address: null,
        birthday: /birth|dob/i.test(block) ? date : null,
        products,
        balanceTestDate: /balance\s*test/i.test(block) ? date : null,
        notes: null,
        interests: [],
        commPreference: email && !phone ? "EMAIL" : phone ? "SMS" : null,
      };
    });
  }

  async draftMessage(ctx: MessageDraftContext): Promise<MessageDraft> {
    const first = ctx.contactName.split(" ")[0];
    const product = ctx.products[0];
    let body: string;

    if (/birthday/i.test(ctx.purpose)) {
      body = `Happy birthday, ${first}! 🎉 Hope you have a wonderful day — wishing you a fantastic year ahead!`;
    } else if (/balance\s*test/i.test(ctx.purpose)) {
      body = `Hi ${first}! It's been about six months since your last BalanceTest — a great time to re-test and see your progress. Want me to help you set one up?`;
    } else if (/reorder/i.test(ctx.purpose) && product) {
      body = `Hi ${first}! Just a heads-up that you might be running low on ${product}. Happy to sort out a refill whenever you're ready!`;
    } else if (/inactive/i.test(ctx.purpose)) {
      body = `Hi ${first}! It's been a while — I'd love to hear how you're doing. No pressure at all, just checking in. 😊`;
    } else if (product) {
      body = `Hi ${first}! Just checking in to see how you're getting on with ${product}. Let me know if you have any questions — happy to help!`;
    } else {
      body = `Hi ${first}! Just checking in to see how you're doing. Let me know if there's anything I can help with!`;
    }

    if (ctx.senderName) {
      body += `\n– ${ctx.senderName.split(" ")[0]}`;
    }

    return {
      subject: ctx.channel === "EMAIL" ? `Checking in, ${first}!` : null,
      body,
    };
  }

  async suggestNextAction(s: ContactSnapshot): Promise<string> {
    if (s.daysSinceLastContact !== null && s.daysSinceLastContact >= 60) {
      return `${s.name} has not been contacted for ${s.daysSinceLastContact} days. Recommend sending a friendly check-in.`;
    }
    if (s.lastBalanceTestDate) {
      const days = Math.floor(
        (Date.now() - new Date(s.lastBalanceTestDate).getTime()) / 86_400_000
      );
      if (days >= 170) {
        return `${s.name} is due for a 6-month BalanceTest follow-up. Recommend offering a re-test.`;
      }
    }
    if (s.status === "LEAD") {
      return `${s.name} is still a lead. Recommend a low-pressure nurture message sharing your own experience.`;
    }
    return `${s.name} is in good standing. A short personal note keeps the relationship warm.`;
  }

  async copilotTurn(
    messages: CopilotMessage[],
    tools: CopilotToolDef[]
  ): Promise<CopilotTurnResult> {
    // Single-shot heuristic router over the same tool set the real model uses.
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const q = typeof lastUser?.content === "string" ? lastUser.content : "";
    const hasToolResults =
      Array.isArray(lastUser?.content) &&
      lastUser.content.some((c) => c.type === "tool_result");

    if (hasToolResults) {
      const results = (lastUser!.content as Array<{ type: string; content?: string }>)
        .filter((c) => c.type === "tool_result")
        .map((c) => c.content ?? "")
        .join("\n");
      return {
        reply:
          `Here's what I found:\n\n${results}\n\n` +
          `(Demo mode — set ANTHROPIC_API_KEY for full conversational answers.)`,
        toolCalls: [],
        stop: "end",
      };
    }

    const call = (name: string, input: Record<string, unknown>): CopilotTurnResult => ({
      reply: "",
      toolCalls: [{ id: `mock_${Date.now()}`, name, input }],
      stop: "tool_use",
    });

    const daysMatch = q.match(/(\d+)\s*days/);
    if (/heard from me|contacted|check.?in/i.test(q) && daysMatch) {
      return call("search_contacts", { notContactedDays: Number(daysMatch[1]) });
    }
    if (/birthday/i.test(q)) {
      return call("search_contacts", { birthdaysThisMonth: true });
    }
    if (/balance\s*test/i.test(q)) {
      return call("search_contacts", { balanceTestDue: true });
    }
    if (/follow.?up|generate|draft/i.test(q)) {
      const productMatch = KNOWN_PRODUCTS.find((p) =>
        q.toLowerCase().includes(p.toLowerCase().replace("+", ""))
      );
      return call("draft_messages_for_segment", {
        product: productMatch ?? null,
        purpose: "friendly check-in follow-up",
      });
    }
    if (tools.length > 0 && /who|show|list|find/i.test(q)) {
      return call("search_contacts", {});
    }
    return {
      reply:
        "I can help you find contacts (\"Who hasn't heard from me in 90 days?\"), " +
        "show birthdays this month, find customers due for a BalanceTest, or draft " +
        "follow-up messages for a group. What would you like to do?",
      toolCalls: [],
      stop: "end",
    };
  }
}
