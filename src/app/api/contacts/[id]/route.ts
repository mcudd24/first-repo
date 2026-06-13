import { NextRequest, NextResponse } from "next/server";
import {
  deleteContact,
  getContactProfile,
  updateContact,
} from "@/server/services/contactService";
import { requireUserId } from "@/server/user";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  const { id } = await params;
  const profile = await getContactProfile(userId, id);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  const { id } = await params;
  const data = await req.json();
  try {
    const contact = await updateContact(userId, id, data);
    return NextResponse.json(contact);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 404 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  const { id } = await params;
  try {
    await deleteContact(userId, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
