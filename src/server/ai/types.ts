import { z } from "zod";

// ---------- Contact extraction ----------

export const extractedContactSchema = z.object({
  firstName: z.string(),
  lastName: z.string().default(""),
  email: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  address: z.string().nullable().default(null),
  birthday: z.string().nullable().default(null), // ISO date string
  products: z.array(z.string()).default([]),
  balanceTestDate: z.string().nullable().default(null), // ISO date string
  notes: z.string().nullable().default(null),
  interests: z.array(z.string()).default([]),
  commPreference: z.enum(["SMS", "EMAIL", "WHATSAPP"]).nullable().default(null),
});

export type ExtractedContact = z.infer<typeof extractedContactSchema>;

// JSON Schema mirror of the Zod schema above, sent to the model via
// structured outputs so the response is guaranteed parseable.
export const extractionJsonSchema = {
  type: "object",
  properties: {
    contacts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: ["string", "null"] },
          phone: { type: ["string", "null"] },
          address: { type: ["string", "null"] },
          birthday: {
            type: ["string", "null"],
            description: "ISO date YYYY-MM-DD if present",
          },
          products: { type: "array", items: { type: "string" } },
          balanceTestDate: {
            type: ["string", "null"],
            description: "ISO date YYYY-MM-DD if present",
          },
          notes: { type: ["string", "null"] },
          interests: { type: "array", items: { type: "string" } },
          commPreference: {
            type: ["string", "null"],
            enum: ["SMS", "EMAIL", "WHATSAPP", null],
          },
        },
        required: [
          "firstName",
          "lastName",
          "email",
          "phone",
          "address",
          "birthday",
          "products",
          "balanceTestDate",
          "notes",
          "interests",
          "commPreference",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["contacts"],
  additionalProperties: false,
} as const;

// ---------- Inputs ----------

export interface ExtractionInput {
  /** Pasted or forwarded text (e.g. email body). */
  text?: string;
  /** Uploaded files as base64; images and PDFs are supported. */
  files?: { mediaType: string; dataBase64: string }[];
}

export interface MessageDraftContext {
  contactName: string;
  channel: "SMS" | "EMAIL" | "WHATSAPP";
  purpose: string; // e.g. "30-day follow-up", "birthday greeting"
  products: string[];
  interests: string[];
  daysSinceLastContact: number | null;
  lastBalanceTestDate: string | null;
  extraInstructions?: string;
  /** Partner's name, used for sign-offs when set. */
  senderName?: string;
}

export interface MessageDraft {
  subject: string | null; // email only
  body: string;
}

export interface ContactSnapshot {
  name: string;
  status: string;
  daysSinceLastContact: number | null;
  products: string[];
  lastBalanceTestDate: string | null;
  birthday: string | null;
  notes: string | null;
}

// ---------- Copilot ----------

export interface CopilotToolCall {
  name: string;
  input: Record<string, unknown>;
  id: string;
}

export interface CopilotTurnResult {
  /** Final assistant text for this turn. */
  reply: string;
  /** Tool calls the model wants executed (resolved by the copilot service loop). */
  toolCalls: CopilotToolCall[];
  stop: "end" | "tool_use";
}

export interface CopilotMessage {
  role: "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
        | { type: "tool_result"; tool_use_id: string; content: string }
      >;
}

export interface CopilotToolDef {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

// ---------- Provider interface ----------

export interface AIProvider {
  readonly name: string;
  extractContacts(input: ExtractionInput): Promise<ExtractedContact[]>;
  draftMessage(ctx: MessageDraftContext): Promise<MessageDraft>;
  suggestNextAction(snapshot: ContactSnapshot): Promise<string>;
  copilotTurn(messages: CopilotMessage[], tools: CopilotToolDef[]): Promise<CopilotTurnResult>;
}
