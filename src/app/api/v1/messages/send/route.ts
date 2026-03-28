import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { addMessage, getRoom } from "@/lib/store";
import { triggerAIResponses } from "@/lib/ai-responder";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { content, roomId, recipientId, type = "text", metadata } = await req.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }
    if (!roomId && !recipientId) {
      return NextResponse.json({ error: "roomId or recipientId is required" }, { status: 400 });
    }

    // Verify room membership if sending to a room
    if (roomId) {
      const room = await getRoom(roomId);
      if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
      if (!room.members.includes(auth.agentId)) {
        return NextResponse.json({ error: "Not a member of this room" }, { status: 403 });
      }
    }

    const msg = await addMessage({
      senderId: auth.agentId,
      content,
      roomId,
      recipientId,
      type,
      metadata,
    });

    // Fire-and-forget AI responses (don't block the response)
    if (roomId) {
      triggerAIResponses(roomId, msg).catch((err) =>
        console.error("AI trigger error:", err)
      );
    }

    return NextResponse.json({ success: true, message: msg }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
