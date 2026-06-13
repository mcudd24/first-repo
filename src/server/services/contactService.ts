import { subDays } from "date-fns";
import { db } from "@/server/db";
import { parseJson, toJson } from "@/lib/json";
import { daysSince } from "@/lib/dates";
import { getAI } from "@/server/ai";
import { addTimelineEvent } from "./timelineService";

export interface ContactFilters {
  search?: string;
  status?: string;
  notContactedDays?: number;
  birthdaysThisMonth?: boolean;
  balanceTestDue?: boolean; // last test > ~6 months ago (or never, with purchases)
  product?: string;
}

export async function listContacts(userId: string, filters: ContactFilters = {}) {
  const where: Record<string, unknown> = { userId };

  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search } },
    ];
  }
  if (filters.notContactedDays !== undefined) {
    const cutoff = subDays(new Date(), filters.notContactedDays);
    where.OR = [{ lastContactedAt: { lt: cutoff } }, { lastContactedAt: null }];
  }
  if (filters.product) {
    where.purchases = {
      some: { product: { name: { contains: filters.product, mode: "insensitive" } } },
    };
  }

  let contacts = await db.contact.findMany({
    where,
    include: {
      purchases: { include: { product: true } },
      balanceTests: { orderBy: { testDate: "desc" }, take: 1 },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  // Month/recency filters that don't map to portable SQL run in memory —
  // fine at MVP scale (hundreds of contacts per partner).
  if (filters.birthdaysThisMonth) {
    const month = new Date().getMonth();
    contacts = contacts.filter((c) => c.birthday && new Date(c.birthday).getMonth() === month);
  }
  if (filters.balanceTestDue) {
    const cutoff = subDays(new Date(), 170);
    contacts = contacts.filter((c) => {
      const last = c.balanceTests[0];
      if (last) return new Date(last.testDate) < cutoff;
      return c.purchases.length > 0; // customer with no test on record
    });
  }

  return contacts.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    status: c.status,
    birthday: c.birthday,
    photoUrl: c.photoUrl,
    interests: parseJson<string[]>(c.interests, []),
    lastContactedAt: c.lastContactedAt,
    daysSinceContact: daysSince(c.lastContactedAt),
    products: c.purchases.map((p) => p.product.name),
    lastBalanceTest: c.balanceTests[0]?.testDate ?? null,
  }));
}

export interface CreateContactInput {
  firstName: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  birthday?: string | null;
  status?: string;
  interests?: string[];
  commPreference?: string | null;
  healthConcerns?: string | null;
  notes?: string | null;
  products?: string[];
  balanceTestDate?: string | null;
  source?: string; // timeline provenance, e.g. "Imported from PDF"
}

export async function createContact(userId: string, input: CreateContactInput) {
  const contact = await db.contact.create({
    data: {
      userId,
      firstName: input.firstName,
      lastName: input.lastName ?? "",
      email: input.email || null,
      phone: input.phone || null,
      address: input.address || null,
      birthday: input.birthday ? new Date(input.birthday) : null,
      status: input.status ?? (input.products?.length ? "CUSTOMER" : "LEAD"),
      interests: toJson(input.interests ?? []),
      commPreference: input.commPreference || null,
      healthConcerns: input.healthConcerns || null,
      notes: input.notes || null,
    },
  });

  await addTimelineEvent(
    userId,
    contact.id,
    "IMPORTED",
    input.source ?? "Contact created",
    input.notes ?? undefined
  );

  for (const productName of input.products ?? []) {
    const product = await db.product.upsert({
      where: { name: productName },
      create: { name: productName, category: "Supplement" },
      update: {},
    });
    await db.purchase.create({
      data: { userId, contactId: contact.id, productId: product.id },
    });
    await addTimelineEvent(userId, contact.id, "PURCHASE", `Ordered ${productName}`);
  }

  if (input.balanceTestDate) {
    const testDate = new Date(input.balanceTestDate);
    await db.balanceTest.create({
      data: { userId, contactId: contact.id, testDate },
    });
    await addTimelineEvent(
      userId,
      contact.id,
      "BALANCE_TEST",
      "BalanceTest taken",
      undefined,
      testDate
    );
  }

  return contact;
}

export async function getContactProfile(userId: string, id: string) {
  const contact = await db.contact.findFirst({
    where: { id, userId },
    include: {
      purchases: { include: { product: true }, orderBy: { purchasedAt: "desc" } },
      balanceTests: { orderBy: { testDate: "desc" } },
      messages: { orderBy: { createdAt: "desc" }, take: 20 },
      reminders: { where: { status: "PENDING" }, orderBy: { dueDate: "asc" } },
      timeline: { orderBy: { occurredAt: "desc" }, take: 50 },
    },
  });
  if (!contact) return null;

  const snapshot = {
    name: `${contact.firstName} ${contact.lastName}`.trim(),
    status: contact.status,
    daysSinceLastContact: daysSince(contact.lastContactedAt),
    products: contact.purchases.map((p) => p.product.name),
    lastBalanceTestDate: contact.balanceTests[0]?.testDate.toISOString() ?? null,
    birthday: contact.birthday?.toISOString() ?? null,
    healthConcerns: contact.healthConcerns,
    notes: contact.notes,
  };
  const aiSuggestion = await getAI().suggestNextAction(snapshot);

  return {
    ...contact,
    interests: parseJson<string[]>(contact.interests, []),
    daysSinceContact: daysSince(contact.lastContactedAt),
    aiSuggestion,
  };
}

export async function updateContact(
  userId: string,
  id: string,
  data: Partial<Omit<CreateContactInput, "products" | "balanceTestDate" | "source">>
) {
  // updateMany scoped by userId is the safest single-step authorization check.
  const result = await db.contact.updateMany({
    where: { id, userId },
    data: {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.birthday !== undefined && {
        birthday: data.birthday ? new Date(data.birthday) : null,
      }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.interests !== undefined && { interests: toJson(data.interests) }),
      ...(data.commPreference !== undefined && { commPreference: data.commPreference }),
      ...(data.healthConcerns !== undefined && { healthConcerns: data.healthConcerns }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });
  if (result.count === 0) throw new Error("Contact not found");
  return db.contact.findUnique({ where: { id } });
}

export async function deleteContact(userId: string, id: string) {
  const result = await db.contact.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw new Error("Contact not found");
}

async function assertOwned(userId: string, contactId: string) {
  const owned = await db.contact.findFirst({
    where: { id: contactId, userId },
    select: { id: true },
  });
  if (!owned) throw new Error("Contact not found");
}

export async function addNote(userId: string, contactId: string, note: string) {
  await assertOwned(userId, contactId);
  await addTimelineEvent(userId, contactId, "NOTE", "Note added", note);
}

export async function addPurchase(
  userId: string,
  contactId: string,
  productName: string,
  purchasedAt?: string
) {
  await assertOwned(userId, contactId);
  const product = await db.product.upsert({
    where: { name: productName },
    create: { name: productName, category: "Supplement" },
    update: {},
  });
  const date = purchasedAt ? new Date(purchasedAt) : new Date();
  const purchase = await db.purchase.create({
    data: { userId, contactId, productId: product.id, purchasedAt: date },
  });
  // Logging an order implies the customer relationship is active.
  await db.contact
    .updateMany({
      where: { id: contactId, userId, status: "LEAD" },
      data: { status: "CUSTOMER" },
    })
    .catch(() => undefined);
  await addTimelineEvent(
    userId,
    contactId,
    "PURCHASE",
    `Ordered ${productName}`,
    undefined,
    date
  );
  return purchase;
}

export async function addBalanceTest(
  userId: string,
  contactId: string,
  testDate: string,
  notes?: string
) {
  await assertOwned(userId, contactId);
  const date = new Date(testDate);
  const test = await db.balanceTest.create({
    data: { userId, contactId, testDate: date, notes: notes || null },
  });
  await addTimelineEvent(
    userId,
    contactId,
    "BALANCE_TEST",
    "BalanceTest taken",
    notes,
    date
  );
  return test;
}
