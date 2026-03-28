import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateAgentStatus } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const lastSeen = Date.now();
  await updateAgentStatus(auth.agentId, "online");

  return NextResponse.json({ success: true, agentId: auth.agentId, lastSeen });
}
