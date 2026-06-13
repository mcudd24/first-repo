import { NextResponse } from "next/server";
import { listContacts } from "@/server/services/contactService";
import { requireUserId } from "@/server/user";

function csvEscape(value: string | null | undefined): string {
  const s = value ?? "";
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const userId = await requireUserId();
  const contacts = await listContacts(userId);
  const header = [
    "First name",
    "Last name",
    "Email",
    "Phone",
    "Status",
    "Birthday",
    "Products",
    "Last BalanceTest",
    "Last contacted",
    "Interests",
  ];
  const rows = contacts.map((c) =>
    [
      c.firstName,
      c.lastName,
      c.email,
      c.phone,
      c.status,
      c.birthday ? new Date(c.birthday).toISOString().slice(0, 10) : "",
      c.products.join("; "),
      c.lastBalanceTest ? new Date(c.lastBalanceTest).toISOString().slice(0, 10) : "",
      c.lastContactedAt ? new Date(c.lastContactedAt).toISOString().slice(0, 10) : "",
      c.interests.join("; "),
    ]
      .map(csvEscape)
      .join(",")
  );
  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zinzino-contacts-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
