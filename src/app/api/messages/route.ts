import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId") || undefined;
  const recipientId = searchParams.get("recipientId") || undefined;
  const senderId = searchParams.get("senderId") || undefined;
  return NextResponse.json(getMessages({ roomId, recipientId, senderId }));
}
