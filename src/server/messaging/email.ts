// Email provider slot (Resend/SES/SMTP — pick one in Phase 2).

import { MessagingProvider, OutboundMessage, SendResult } from "./index";

export class EmailProvider implements MessagingProvider {
  readonly name = "email";

  async send(message: OutboundMessage): Promise<SendResult> {
    if (!process.env.EMAIL_FROM) {
      return { ok: false, error: "Email sender not configured" };
    }
    // Phase 2: deliver via the chosen email service.
    return { ok: false, error: "Email provider not yet implemented" };
  }

  static supports(message: OutboundMessage): boolean {
    return message.channel === "EMAIL";
  }
}
