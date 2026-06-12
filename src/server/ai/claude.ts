import Anthropic from "@anthropic-ai/sdk";
import {
  AIProvider,
  ContactSnapshot,
  CopilotMessage,
  CopilotToolDef,
  CopilotTurnResult,
  ExtractedContact,
  extractedContactSchema,
  ExtractionInput,
  extractionJsonSchema,
  MessageDraft,
  MessageDraftContext,
} from "./types";
import { SAFETY_RULES } from "./safety";

const MODEL = process.env.AI_MODEL || "claude-opus-4-8";

const BRAND_VOICE = `You write on behalf of an independent Zinzino Partner.
Voice: warm, personal, concise, never pushy. Sounds like a real person texting
or emailing a friend, not a marketing blast.${SAFETY_RULES}`;

export class ClaudeProvider implements AIProvider {
  readonly name = "claude";
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  async extractContacts(input: ExtractionInput): Promise<ExtractedContact[]> {
    const content: Anthropic.ContentBlockParam[] = [];

    for (const file of input.files ?? []) {
      if (file.mediaType === "application/pdf") {
        content.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: file.dataBase64 },
        });
      } else {
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: file.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: file.dataBase64,
          },
        });
      }
    }

    if (input.text) {
      content.push({ type: "text", text: `Source text:\n${input.text}` });
    }

    content.push({
      type: "text",
      text:
        "Extract every distinct person from the material above (handwritten forms, " +
        "photos, screenshots, PDFs, or forwarded email text). Dates must be ISO " +
        "YYYY-MM-DD; use null for anything not present. Product names should match " +
        "Zinzino products where recognizable (e.g. BalanceOil+, ZinoBiotic+, Xtend).",
    });

    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system:
        "You extract structured contact data for a CRM. Be precise; never invent " +
        "data that is not present in the source.",
      messages: [{ role: "user", content }],
      output_config: {
        format: { type: "json_schema", schema: extractionJsonSchema },
      },
    });

    const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
    const parsed = JSON.parse(text) as { contacts?: unknown[] };
    return (parsed.contacts ?? []).map((c) => extractedContactSchema.parse(c));
  }

  async draftMessage(ctx: MessageDraftContext): Promise<MessageDraft> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: BRAND_VOICE,
      messages: [
        {
          role: "user",
          content:
            `Write a ${ctx.channel} message.\n` +
            `Recipient: ${ctx.contactName}\n` +
            `Purpose: ${ctx.purpose}\n` +
            `Their products: ${ctx.products.join(", ") || "none yet"}\n` +
            `Their interests: ${ctx.interests.join(", ") || "unknown"}\n` +
            `Days since last contact: ${ctx.daysSinceLastContact ?? "unknown"}\n` +
            `Last BalanceTest: ${ctx.lastBalanceTestDate ?? "none"}\n` +
            (ctx.extraInstructions ? `Extra instructions: ${ctx.extraInstructions}\n` : "") +
            `\nSMS/WhatsApp: 1-3 short sentences, no subject. ` +
            `Email: a short subject line then a brief friendly body.`,
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              subject: { type: ["string", "null"], description: "Email subject, null for SMS/WhatsApp" },
              body: { type: "string" },
            },
            required: ["subject", "body"],
            additionalProperties: false,
          },
        },
      },
    });

    const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
    const parsed = JSON.parse(text) as { subject?: string | null; body?: string };
    return { subject: parsed.subject ?? null, body: parsed.body ?? "" };
  }

  async suggestNextAction(snapshot: ContactSnapshot): Promise<string> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 300,
      system:
        `You advise a Zinzino Partner on customer relationships. Reply with one ` +
        `short actionable recommendation (max 2 sentences).${SAFETY_RULES}`,
      messages: [
        { role: "user", content: `Customer snapshot:\n${JSON.stringify(snapshot, null, 2)}` },
      ],
    });
    return response.content.find((b) => b.type === "text")?.text?.trim() ?? "";
  }

  async copilotTurn(
    messages: CopilotMessage[],
    tools: CopilotToolDef[]
  ): Promise<CopilotTurnResult> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system:
        `You are the Zinzino Connect AI copilot — an assistant inside a CRM for an ` +
        `independent Zinzino Partner. Use the available tools to answer questions ` +
        `about contacts and to PROPOSE actions. You can create message drafts and ` +
        `reminders; drafts always require the partner's approval before sending — ` +
        `tell the user where to review them. Be concise and helpful.${SAFETY_RULES}`,
      messages: messages as Anthropic.MessageParam[],
      tools: tools as Anthropic.Tool[],
    });

    const reply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const toolCalls = response.content
      .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
      .map((b) => ({ id: b.id, name: b.name, input: b.input as Record<string, unknown> }));

    return {
      reply,
      toolCalls,
      stop: response.stop_reason === "tool_use" ? "tool_use" : "end",
    };
  }
}
