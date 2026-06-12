import { NextRequest, NextResponse } from "next/server";
import { addPurchase } from "@/server/services/contactService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { productName, purchasedAt } = await req.json();
  if (!productName || typeof productName !== "string") {
    return NextResponse.json({ error: "productName is required" }, { status: 400 });
  }
  const purchase = await addPurchase(id, productName.trim(), purchasedAt);
  return NextResponse.json(purchase, { status: 201 });
}
