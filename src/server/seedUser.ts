// First-run seed for a brand-new user: their 8 automation rules plus a couple
// of demo contacts so the dashboard isn't empty on the first sign-in.

import { subDays, subMonths } from "date-fns";
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

  // Shared product catalog — upsert is idempotent across users.
  const productInputs = [
    { name: "BalanceOil+", category: "Omega supplement" },
    { name: "ZinoBiotic+", category: "Fiber blend" },
    { name: "Xtend", category: "Multivitamin" },
  ];
  const products = await Promise.all(
    productInputs.map((p) =>
      db.product.upsert({ where: { name: p.name }, create: p, update: {} })
    )
  );
  const byName = Object.fromEntries(products.map((p) => [p.name, p]));

  const today = new Date();
  const demo = [
    {
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@example.com",
      phone: "+1 555 0101",
      status: "CUSTOMER",
      notes: "Demo contact — started BalanceOil after her first BalanceTest.",
      lastContactedAt: subDays(today, 12),
      products: ["BalanceOil+", "ZinoBiotic+"],
      balanceTest: subMonths(today, 2),
    },
    {
      firstName: "Mary",
      lastName: "Andersen",
      email: "mary.andersen@example.com",
      status: "CUSTOMER",
      notes: "Demo contact — prefers email; asked about subscription discounts.",
      lastContactedAt: subDays(today, 62),
      products: ["BalanceOil+"],
      balanceTest: subMonths(today, 7),
    },
    {
      firstName: "Priya",
      lastName: "Shah",
      email: "priya.shah@example.com",
      phone: "+1 555 0106",
      status: "LEAD",
      notes: "Demo contact — met at the wellness fair; interested in omega testing.",
      lastContactedAt: subDays(today, 16),
    },
  ];

  for (const c of demo) {
    const contact = await db.contact.create({
      data: {
        userId,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        status: c.status,
        notes: c.notes,
        lastContactedAt: c.lastContactedAt,
      },
    });
    await db.timelineEvent.create({
      data: {
        userId,
        contactId: contact.id,
        type: "IMPORTED",
        title: "Demo contact added",
        description: c.notes,
        occurredAt: subDays(today, 60),
      },
    });
    for (const productName of c.products ?? []) {
      const purchasedAt = subDays(today, 40);
      await db.purchase.create({
        data: {
          userId,
          contactId: contact.id,
          productId: byName[productName].id,
          purchasedAt,
        },
      });
      await db.timelineEvent.create({
        data: {
          userId,
          contactId: contact.id,
          type: "PURCHASE",
          title: `Ordered ${productName}`,
          occurredAt: purchasedAt,
        },
      });
    }
    if (c.balanceTest) {
      await db.balanceTest.create({
        data: { userId, contactId: contact.id, testDate: c.balanceTest },
      });
      await db.timelineEvent.create({
        data: {
          userId,
          contactId: contact.id,
          type: "BALANCE_TEST",
          title: "BalanceTest taken",
          occurredAt: c.balanceTest,
        },
      });
    }
  }
}
