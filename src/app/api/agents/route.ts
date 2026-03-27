import { NextRequest, NextResponse } from "next/server";
import { getAgents, upsertAgent } from "@/lib/store";
import { Agent } from "@/types";

export async function GET() {
  return NextResponse.json(getAgents());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const agent: Agent = {
    id: body.id || `agent-${Date.now()}`,
    name: body.name,
    avatar: body.avatar || "🤖",
    status: body.status || "online",
    description: body.description || "",
    capabilities: body.capabilities || [],
    lastSeen: Date.now(),
  };
  return NextResponse.json(upsertAgent(agent), { status: 201 });
}
