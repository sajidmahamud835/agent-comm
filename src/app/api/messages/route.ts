import { NextRequest, NextResponse } from "next/server";
import { getMessages, addMessage, getRoom } from "@/lib/store";
import { triggerAIResponses } from "@/lib/ai-responder";
import { after } from "next/server";

// Legacy endpoint for dashboard UI (no auth required for reading)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId") || undefined;
  const recipientId = searchParams.get("recipientId") || undefined;
  const senderId = searchParams.get("senderId") || undefined;
  const since = searchParams.get("since") ? Number(searchParams.get("since")) : undefined;
  return NextResponse.json(await getMessages({ roomId, recipientId, senderId, since }));
}

// Legacy POST for dashboard UI (simplified, no auth)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { senderId, content, roomId, recipientId, type = "text" } = body;

    if (!senderId || !content) {
      return NextResponse.json({ error: "senderId and content required" }, { status: 400 });
    }

    if (roomId) {
      const room = await getRoom(roomId);
      if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const msg = await addMessage({ senderId, content, roomId, recipientId, type });

    // Trigger AI responses
    if (roomId) {
      after(async () => {
        try {
          await triggerAIResponses(roomId, msg);
        } catch (err) {
          console.error("AI trigger error:", err);
        }
      });
    }

    return NextResponse.json(msg, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
