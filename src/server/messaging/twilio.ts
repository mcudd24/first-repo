// Twilio integration slot. Implement MessagingProvider and wire it in
// src/server/messaging/index.ts when TWILIO_* env vars are configured.

import { MessagingProvider, OutboundMessage, SendResult } from "./index";

export class TwilioProvider implements MessagingProvider {
  readonly name = "twilio";

  async send(message: OutboundMessage): Promise<SendResult> {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return { ok: false, error: "Twilio credentials not configured" };
    }
    // Phase 2: POST to Twilio Messages API (SMS / WhatsApp via channel prefix).
    return { ok: false, error: "Twilio provider not yet implemented" };
  }

  static supports(message: OutboundMessage): boolean {
    return message.channel === "SMS" || message.channel === "WHATSAPP";
  }
}
