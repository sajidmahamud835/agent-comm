import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { leaveRoom } from "@/lib/store";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { roomId } = await req.json();
    if (!roomId) return NextResponse.json({ error: "roomId is required" }, { status: 400 });

    const ok = leaveRoom(roomId, auth.agentId);
    if (!ok) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    return NextResponse.json({ success: true, roomId, agentId: auth.agentId });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
