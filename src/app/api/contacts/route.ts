import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createContact, listContacts } from "@/server/services/contactService";
import { requireUserId } from "@/server/user";

export async function GET(req: NextRequest) {
  const userId = await requireUserId();
  const params = req.nextUrl.searchParams;
  const contacts = await listContacts(userId, {
    search: params.get("search") ?? undefined,
    status: params.get("status") ?? undefined,
    notContactedDays: params.get("notContactedDays")
      ? Number(params.get("notContactedDays"))
      : undefined,
    birthdaysThisMonth: params.get("birthdaysThisMonth") === "true",
    balanceTestDue: params.get("balanceTestDue") === "true",
    product: params.get("product") ?? undefined,
  });
  return NextResponse.json(contacts);
}

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().nullish(),
  phone: z.string().nullish(),
  address: z.string().nullish(),
  birthday: z.string().nullish(),
  status: z.enum(["LEAD", "CUSTOMER", "INACTIVE"]).optional(),
  interests: z.array(z.string()).optional(),
  commPreference: z.enum(["SMS", "EMAIL", "WHATSAPP"]).nullish(),
  healthConcerns: z.string().nullish(),
  notes: z.string().nullish(),
  products: z.array(z.string()).optional(),
  balanceTestDate: z.string().nullish(),
});

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  const body = createSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.message }, { status: 400 });
  }
  const contact = await createContact(userId, {
    ...body.data,
    source: "Contact created manually",
  });
  return NextResponse.json(contact, { status: 201 });
}
