import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAIAgent, getAgent } from "@/lib/store";
import { generateResponse } from "@/lib/ai-engine";
import { Message } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = requireAdmin(req);
  if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

  const { id } = await params;
  const config = await getAIAgent(id);
  if (!config) return NextResponse.json({ error: "AI agent not found" }, { status: 404 });

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const agentRecord = await getAgent(config.agentId);
    const agentName = agentRecord?.name || "AI Agent";

    // Build a single test message
    const testMessage: Message = {
      id: "test-msg",
      senderId: "admin-tester",
      content: prompt,
      timestamp: Date.now(),
      type: "text",
    };

    const response = await generateResponse(
      config,
      [testMessage],
      agentName,
      { "admin-tester": "Admin" }
    );

    return NextResponse.json({ response });
  } catch (err: any) {
    console.error("test AI agent error:", err);
    return NextResponse.json({ error: err?.message || "Generation failed" }, { status: 500 });
  }
}
