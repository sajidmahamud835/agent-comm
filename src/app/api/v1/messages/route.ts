import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getMessages } from "@/lib/store";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId") || undefined;
  const recipientId = searchParams.get("recipientId") || undefined;
  const since = searchParams.get("since") ? Number(searchParams.get("since")) : undefined;
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 100;

  const messages = await getMessages({
    roomId,
    recipientId,
    senderId: auth.agentId,
    since,
    limit,
  });

  return NextResponse.json({ messages });
}
