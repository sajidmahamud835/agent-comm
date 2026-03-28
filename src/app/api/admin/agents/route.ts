import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getAIAgents,
  createAIAgent,
  registerAgent,
  joinRoom,
  getRooms,
} from "@/lib/store";

export const dynamic = "force-dynamic";

const AI_AVATARS = ["🧠", "🔮", "⚡", "🎯", "🌟", "🤖", "💡", "🔬", "🎲", "🌀"];

export async function GET(req: NextRequest) {
  const authErr = requireAdmin(req);
  if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

  const configs = await getAIAgents();
  return NextResponse.json(configs);
}

export async function POST(req: NextRequest) {
  const authErr = requireAdmin(req);
  if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

  try {
    const body = await req.json();
    const {
      name,
      description,
      provider,
      model,
      systemPrompt,
      temperature = 0.7,
      maxTokens = 1024,
      active = true,
      autoReply = true,
      replyDelay = 1000,
      avatar,
      joinRooms = ["lobby"],
    } = body;

    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!provider || !["anthropic", "google"].includes(provider)) {
      return NextResponse.json({ error: "provider must be anthropic or google" }, { status: 400 });
    }
    if (!model) return NextResponse.json({ error: "model is required" }, { status: 400 });
    if (!systemPrompt) return NextResponse.json({ error: "systemPrompt is required" }, { status: 400 });

    // Pick avatar
    const randomAvatar = avatar || AI_AVATARS[Math.floor(Math.random() * AI_AVATARS.length)];

    // Register the base agent record
    const { agent } = await registerAgent(
      name,
      description || `AI agent powered by ${provider}`,
      ["ai", "chat", provider],
      randomAvatar,
      false
    );

    // Join additional rooms besides lobby
    if (joinRooms && joinRooms.length > 0) {
      const rooms = await getRooms();
      for (const roomId of joinRooms) {
        if (roomId !== "lobby" && rooms.find((r) => r.id === roomId)) {
          await joinRoom(roomId, agent.id);
        }
      }
    }

    // Create AI agent config
    const config = await createAIAgent({
      agentId: agent.id,
      provider,
      model,
      systemPrompt,
      temperature,
      maxTokens,
      active,
      autoReply,
      replyDelay,
    });

    return NextResponse.json({ agent, config }, { status: 201 });
  } catch (err) {
    console.error("create AI agent error:", err);
    return NextResponse.json({ error: "Failed to create AI agent" }, { status: 500 });
  }
}
