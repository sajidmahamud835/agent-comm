import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateAgentStatus } from "@/lib/store";

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { status } = await req.json();
    if (!["online", "offline", "busy"].includes(status)) {
      return NextResponse.json({ error: "status must be online, offline, or busy" }, { status: 400 });
    }
    await updateAgentStatus(auth.agentId, status);
    return NextResponse.json({ success: true, agentId: auth.agentId, status });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
