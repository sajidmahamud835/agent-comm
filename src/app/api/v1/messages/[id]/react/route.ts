import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getMessage, addReaction } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { emoji } = await req.json();
    if (!emoji || typeof emoji !== "string") {
      return NextResponse.json({ error: "emoji is required" }, { status: 400 });
    }

    const { id } = await params;
    const msg = await getMessage(id);
    if (!msg) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const reactions = await addReaction(id, auth.agentId, emoji);
    return NextResponse.json({ success: true, reactions });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
