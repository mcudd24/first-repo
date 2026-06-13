// First-run setup for a brand-new user: create their starter automation rules
// and shared product catalog, but do not create demo contacts in real accounts.

import { db } from "@/server/db";
import { AUTOMATION_DEFS } from "@/server/services/automationDefs";

export async function seedNewUser(userId: string) {
  await db.automation.createMany({
    data: AUTOMATION_DEFS.map((def) => ({
      userId,
      type: def.type,
      name: def.name,
      description: def.description,
      config: JSON.stringify(def.config),
    })),
    skipDuplicates: true,
  });

  // Shared product catalog — upsert is idempotent across users and does not add
  // any people/contact records to a new user's account.
  const productInputs = [
    { name: "BalanceOil+", category: "Omega supplement" },
    { name: "ZinoBiotic+", category: "Fiber blend" },
    { name: "Xtend", category: "Multivitamin" },
    { name: "Protect+", category: "Immune support" },
    { name: "Viva+", category: "Energy and focus" },
  ];

  await Promise.all(
    productInputs.map((p) =>
      db.product.upsert({ where: { name: p.name }, create: p, update: {} })
    )
  );
}
