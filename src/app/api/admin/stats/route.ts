import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAgents, getRooms, getMessages, getAIAgents } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authErr = requireAdmin(req);
  if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

  const [agents, rooms, messages, aiAgents] = await Promise.all([
    getAgents(),
    getRooms(),
    getMessages({ limit: 1000 }),
    getAIAgents(),
  ]);

  return NextResponse.json({
    totalAgents: agents.length,
    humanAgents: agents.filter((a) => a.isHuman).length,
    aiAgents: aiAgents.length,
    activeAIAgents: aiAgents.filter((a) => a.active).length,
    rooms: rooms.length,
    messages: messages.length,
    onlineCount: agents.filter((a) => a.status === "online").length,
  });
}
