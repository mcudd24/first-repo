import { NextRequest, NextResponse } from "next/server";
import { addPurchase } from "@/server/services/contactService";
import { requireUserId } from "@/server/user";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const { productName, purchasedAt } = await req.json();
  if (!productName || typeof productName !== "string") {
    return NextResponse.json({ error: "productName is required" }, { status: 400 });
  }
  try {
    const purchase = await addPurchase(userId, id, productName.trim(), purchasedAt);
    return NextResponse.json(purchase, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 404 }
    );
  }
}
