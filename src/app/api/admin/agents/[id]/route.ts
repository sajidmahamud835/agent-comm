import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getAIAgent,
  updateAIAgent,
  deleteAIAgent,
  updateAgent,
  deleteAgent,
} from "@/lib/store";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = requireAdmin(req);
  if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

  const { id } = await params;
  const config = await getAIAgent(id);
  if (!config) return NextResponse.json({ error: "AI agent not found" }, { status: 404 });

  try {
    const body = await req.json();
    const {
      name,
      description,
      avatar,
      systemPrompt,
      provider,
      model,
      temperature,
      maxTokens,
      active,
      autoReply,
      replyDelay,
    } = body;

    // Update agent record if name/description/avatar changed
    if (name || description || avatar) {
      const agentUpdates: any = {};
      if (name) agentUpdates.name = name;
      if (description) agentUpdates.description = description;
      if (avatar) agentUpdates.avatar = avatar;
      await updateAgent(config.agentId, agentUpdates);
    }

    // Update AI config
    const configUpdates: any = {};
    if (systemPrompt !== undefined) configUpdates.systemPrompt = systemPrompt;
    if (provider !== undefined) configUpdates.provider = provider;
    if (model !== undefined) configUpdates.model = model;
    if (temperature !== undefined) configUpdates.temperature = temperature;
    if (maxTokens !== undefined) configUpdates.maxTokens = maxTokens;
    if (active !== undefined) configUpdates.active = active;
    if (autoReply !== undefined) configUpdates.autoReply = autoReply;
    if (replyDelay !== undefined) configUpdates.replyDelay = replyDelay;

    await updateAIAgent(id, configUpdates);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("update AI agent error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = requireAdmin(req);
  if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

  const { id } = await params;
  const config = await getAIAgent(id);
  if (!config) return NextResponse.json({ error: "AI agent not found" }, { status: 404 });

  // Delete the AI config and the base agent
  await deleteAIAgent(id);
  await deleteAgent(config.agentId);

  return NextResponse.json({ success: true });
}
