// Single-password auth shared by the middleware (edge runtime) and the
// /api/auth routes — Web Crypto only, no Node-specific imports.
//
// The session cookie holds an HMAC derived from the app password, so changing
// APP_PASSWORD invalidates every existing session. Without APP_PASSWORD set
// (zero-config deploys) the app falls back to a published demo password and
// the login page says so.

export const SESSION_COOKIE = "zc_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const DEFAULT_PASSWORD = "zinzino";

export function appPassword(): string {
  return process.env.APP_PASSWORD || DEFAULT_PASSWORD;
}

export function usingDefaultPassword(): boolean {
  return !process.env.APP_PASSWORD;
}

async function hmacHex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function sessionToken(): Promise<string> {
  return hmacHex(appPassword(), "zinzino-connect-session-v1");
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  return !!token && token === (await sessionToken());
}

export async function isCorrectPassword(candidate: string): Promise<boolean> {
  // Compare HMACs rather than the raw strings to keep timing uniform.
  return (
    (await hmacHex("zinzino-connect-pw-check", candidate)) ===
    (await hmacHex("zinzino-connect-pw-check", appPassword()))
  );
}
