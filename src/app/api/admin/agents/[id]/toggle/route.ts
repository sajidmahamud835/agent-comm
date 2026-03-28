import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAIAgent, updateAIAgent } from "@/lib/store";

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

  const newActive = !config.active;
  await updateAIAgent(id, { active: newActive });

  return NextResponse.json({ success: true, active: newActive });
}
