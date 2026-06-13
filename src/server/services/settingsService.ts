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

export async function getSettings(): Promise<AppSettings> {
  const rows = await db.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    partnerName: map.partnerName ?? DEFAULTS.partnerName,
    emailSignature: map.emailSignature ?? DEFAULTS.emailSignature,
  };
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  for (const [key, value] of Object.entries(patch)) {
    if (typeof value !== "string") continue;
    await db.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
  return getSettings();
}
