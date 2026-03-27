import { NextRequest, NextResponse } from "next/server";
import { getMessages, addMessage } from "@/lib/store";
import { Message } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId") || undefined;
  const recipientId = searchParams.get("recipientId") || undefined;
  const senderId = searchParams.get("senderId") || undefined;
  return NextResponse.json(getMessages(roomId, recipientId, senderId));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const msg: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    senderId: body.senderId,
    content: body.content,
    timestamp: Date.now(),
    roomId: body.roomId,
    recipientId: body.recipientId,
    type: body.type || "text",
  };
  return NextResponse.json(addMessage(msg), { status: 201 });
}
