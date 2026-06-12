// Demo data so the app is instantly explorable: contacts in every state an
// automation cares about (birthday today, 30/60/90-day quiet, BalanceTest
// overdue, inactive, fresh lead).

import { PrismaClient } from "@prisma/client";
import { subDays, subMonths } from "date-fns";

const db = new PrismaClient();

function birthdayOn(month: number, day: number, year = 1985): Date {
  return new Date(Date.UTC(year, month, day));
}

async function main() {
  const today = new Date();

  const products = await Promise.all(
    [
      { name: "BalanceOil+", category: "Omega supplement" },
      { name: "ZinoBiotic+", category: "Fiber blend" },
      { name: "Xtend", category: "Multivitamin" },
      { name: "Protect+", category: "Immune support" },
      { name: "Viva+", category: "Wellbeing" },
    ].map((p) => db.product.upsert({ where: { name: p.name }, create: p, update: {} }))
  );
  const byName = Object.fromEntries(products.map((p) => [p.name, p]));

  const contacts: Array<{
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
    birthday?: Date;
    status: string;
    interests?: string[];
    commPreference?: string;
    notes?: string;
    lastContactedAt?: Date;
    purchases?: { product: string; daysAgo: number }[];
    balanceTests?: { monthsAgo: number; notes?: string }[];
  }> = [
    {
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@example.com",
      phone: "+1 555 0101",
      address: "12 Maple Ave, Portland, OR",
      birthday: birthdayOn(today.getMonth(), today.getDate(), 1988), // birthday TODAY
      status: "CUSTOMER",
      interests: ["yoga", "running"],
      commPreference: "SMS",
      notes: "Started BalanceOil after her first BalanceTest. Very engaged.",
      lastContactedAt: subDays(today, 12),
      purchases: [
        { product: "BalanceOil+", daysAgo: 40 },
        { product: "ZinoBiotic+", daysAgo: 40 },
      ],
      balanceTests: [{ monthsAgo: 2, notes: "Baseline test" }],
    },
    {
      firstName: "Mary",
      lastName: "Andersen",
      email: "mary.andersen@example.com",
      phone: "+1 555 0102",
      birthday: birthdayOn(8, 14, 1972),
      status: "CUSTOMER",
      interests: ["gardening", "cooking"],
      commPreference: "EMAIL",
      notes: "Prefers email. Asked about subscription discounts.",
      lastContactedAt: subDays(today, 62), // triggers 60-day follow-up
      purchases: [{ product: "BalanceOil+", daysAgo: 95 }],
      balanceTests: [{ monthsAgo: 7 }], // BalanceTest overdue
    },
    {
      firstName: "Tom",
      lastName: "Larsen",
      phone: "+1 555 0103",
      birthday: birthdayOn((today.getMonth() + 1) % 12, 3, 1990),
      status: "CUSTOMER",
      interests: ["cycling"],
      commPreference: "WHATSAPP",
      lastContactedAt: subDays(today, 31), // triggers 30-day follow-up
      purchases: [{ product: "Xtend", daysAgo: 52 }], // triggers reorder window
    },
    {
      firstName: "Elena",
      lastName: "Petrova",
      email: "elena.p@example.com",
      phone: "+1 555 0104",
      birthday: birthdayOn(today.getMonth(), Math.min(today.getDate() + 4, 28), 1995),
      status: "CUSTOMER",
      interests: ["pilates", "nutrition"],
      commPreference: "SMS",
      notes: "Referred by Sarah Johnson.",
      lastContactedAt: subDays(today, 5),
      purchases: [
        { product: "BalanceOil+", daysAgo: 10 },
        { product: "Protect+", daysAgo: 10 },
      ],
      balanceTests: [{ monthsAgo: 0, notes: "Just tested — waiting on results" }],
    },
    {
      firstName: "James",
      lastName: "Whitfield",
      email: "j.whitfield@example.com",
      birthday: birthdayOn(2, 22, 1968),
      status: "CUSTOMER",
      commPreference: "EMAIL",
      notes: "Long-time customer, quiet lately.",
      lastContactedAt: subDays(today, 130), // inactive
      purchases: [{ product: "BalanceOil+", daysAgo: 150 }],
      balanceTests: [{ monthsAgo: 9 }],
    },
    {
      firstName: "Priya",
      lastName: "Shah",
      email: "priya.shah@example.com",
      phone: "+1 555 0106",
      status: "LEAD",
      interests: ["wellness", "meditation"],
      commPreference: "SMS",
      notes: "Met at the wellness fair. Interested in omega testing.",
      lastContactedAt: subDays(today, 16), // lead nurture window
    },
    {
      firstName: "Daniel",
      lastName: "Kim",
      phone: "+1 555 0107",
      status: "LEAD",
      notes: "Asked for product info — follow up next week.",
      lastContactedAt: subDays(today, 3),
    },
    {
      firstName: "Anna",
      lastName: "Lindqvist",
      email: "anna.l@example.com",
      phone: "+1 555 0108",
      birthday: birthdayOn(today.getMonth(), Math.min(today.getDate() + 12, 28), 1979),
      status: "CUSTOMER",
      interests: ["skiing", "baking"],
      commPreference: "SMS",
      lastContactedAt: subDays(today, 92), // 90-day follow-up
      purchases: [{ product: "Viva+", daysAgo: 120 }],
      balanceTests: [{ monthsAgo: 6 }],
    },
  ];

  for (const c of contacts) {
    const contact = await db.contact.create({
      data: {
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        address: c.address,
        birthday: c.birthday,
        status: c.status,
        interests: JSON.stringify(c.interests ?? []),
        commPreference: c.commPreference,
        notes: c.notes,
        lastContactedAt: c.lastContactedAt,
      },
    });

    await db.timelineEvent.create({
      data: {
        contactId: contact.id,
        type: "IMPORTED",
        title: "Contact created",
        description: c.notes,
        occurredAt: subDays(today, 180),
      },
    });

    for (const p of c.purchases ?? []) {
      const purchasedAt = subDays(today, p.daysAgo);
      await db.purchase.create({
        data: { contactId: contact.id, productId: byName[p.product].id, purchasedAt },
      });
      await db.timelineEvent.create({
        data: {
          contactId: contact.id,
          type: "PURCHASE",
          title: `Ordered ${p.product}`,
          occurredAt: purchasedAt,
        },
      });
    }

    for (const t of c.balanceTests ?? []) {
      const testDate = subMonths(today, t.monthsAgo);
      await db.balanceTest.create({
        data: { contactId: contact.id, testDate, notes: t.notes },
      });
      await db.timelineEvent.create({
        data: {
          contactId: contact.id,
          type: "BALANCE_TEST",
          title: "BalanceTest taken",
          description: t.notes,
          occurredAt: testDate,
        },
      });
    }
  }

  console.log(`Seeded ${contacts.length} contacts and ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
