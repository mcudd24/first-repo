import { db } from "@/server/db";

// Typed app settings over the Setting key-value table.

export interface AppSettings {
  partnerName: string;
  emailSignature: string;
}

const DEFAULTS: AppSettings = {
  partnerName: "",
  emailSignature: "",
};

export async function getSettings(userId: string): Promise<AppSettings> {
  const rows = await db.setting.findMany({ where: { userId } });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    partnerName: map.partnerName ?? DEFAULTS.partnerName,
    emailSignature: map.emailSignature ?? DEFAULTS.emailSignature,
  };
}

export async function updateSettings(
  userId: string,
  patch: Partial<AppSettings>
): Promise<AppSettings> {
  for (const [key, value] of Object.entries(patch)) {
    if (typeof value !== "string") continue;
    await db.setting.upsert({
      where: { userId_key: { userId, key } },
      create: { userId, key, value },
      update: { value },
    });
  }
  return getSettings(userId);
}
