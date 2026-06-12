import { NextRequest, NextResponse } from "next/server";
import {
  deleteContact,
  getContactProfile,
  updateContact,
} from "@/server/services/contactService";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const profile = await getContactProfile(id);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const data = await req.json();
  const contact = await updateContact(id, data);
  return NextResponse.json(contact);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await deleteContact(id);
  return NextResponse.json({ ok: true });
}
