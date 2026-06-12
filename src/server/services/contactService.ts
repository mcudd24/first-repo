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

export async function listContacts(filters: ContactFilters = {}) {
  const where: Record<string, unknown> = {};

  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search } },
      { lastName: { contains: filters.search } },
      { email: { contains: filters.search } },
      { phone: { contains: filters.search } },
    ];
  }
  if (filters.notContactedDays !== undefined) {
    const cutoff = subDays(new Date(), filters.notContactedDays);
    where.OR = [{ lastContactedAt: { lt: cutoff } }, { lastContactedAt: null }];
  }
  if (filters.product) {
    where.purchases = { some: { product: { name: { contains: filters.product } } } };
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
  notes?: string | null;
  products?: string[];
  balanceTestDate?: string | null;
  source?: string; // timeline provenance, e.g. "Imported from PDF"
}

export async function createContact(input: CreateContactInput) {
  const contact = await db.contact.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName ?? "",
      email: input.email || null,
      phone: input.phone || null,
      address: input.address || null,
      birthday: input.birthday ? new Date(input.birthday) : null,
      status: input.status ?? (input.products?.length ? "CUSTOMER" : "LEAD"),
      interests: toJson(input.interests ?? []),
      commPreference: input.commPreference || null,
      notes: input.notes || null,
    },
  });

  await addTimelineEvent(
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
    await db.purchase.create({ data: { contactId: contact.id, productId: product.id } });
    await addTimelineEvent(contact.id, "PURCHASE", `Ordered ${productName}`);
  }

  if (input.balanceTestDate) {
    const testDate = new Date(input.balanceTestDate);
    await db.balanceTest.create({ data: { contactId: contact.id, testDate } });
    await addTimelineEvent(contact.id, "BALANCE_TEST", "BalanceTest taken", undefined, testDate);
  }

  return contact;
}

export async function getContactProfile(id: string) {
  const contact = await db.contact.findUnique({
    where: { id },
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
  id: string,
  data: Partial<Omit<CreateContactInput, "products" | "balanceTestDate" | "source">>
) {
  return db.contact.update({
    where: { id },
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
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });
}

export async function deleteContact(id: string) {
  return db.contact.delete({ where: { id } });
}

export async function addNote(contactId: string, note: string) {
  await addTimelineEvent(contactId, "NOTE", "Note added", note);
}
