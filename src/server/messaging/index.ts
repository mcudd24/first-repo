// Messaging provider abstraction. The MVP ships LogMessagingProvider (records
// the send, delivers nothing). Twilio and email implementations slot in behind
// the same interface — see twilio.ts / email.ts stubs.

export type Channel = "SMS" | "EMAIL" | "WHATSAPP";

export interface OutboundMessage {
  channel: Channel;
  to: string; // phone or email
  subject?: string | null;
  body: string;
}

export interface SendResult {
  ok: boolean;
  providerId?: string;
  error?: string;
}

export interface MessagingProvider {
  readonly name: string;
  send(message: OutboundMessage): Promise<SendResult>;
}

class LogMessagingProvider implements MessagingProvider {
  readonly name = "log";
  async send(message: OutboundMessage): Promise<SendResult> {
    console.info(
      `[messaging] ${message.channel} → ${message.to}: ${message.body.slice(0, 80)}…`
    );
    return { ok: true, providerId: `log_${Date.now()}` };
  }
}

let provider: MessagingProvider | undefined;

export function getMessaging(): MessagingProvider {
  if (!provider) {
    // Future: return TwilioProvider/EmailProvider based on channel + env config.
    provider = new LogMessagingProvider();
  }
  return provider;
}
