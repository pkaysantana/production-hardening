import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  if (params.itemId !== "item-001") {
    return NextResponse.json(
      { error: "Item not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    itemId: "item-001",
    status: "DELIVERED",
    buyer: "0x270216787A9bc1EDC945a8D24E40FbDEdb35B605",
    seller: "0xSELLER_ADDRESS",
    timestamp: 1700000000
  });
}