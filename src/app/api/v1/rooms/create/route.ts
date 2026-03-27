import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createRoom } from "@/lib/store";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { name, description, type = "group", isPublic = true } = await req.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const room = createRoom(name, description || "", type, auth.agentId, isPublic);
    return NextResponse.json({ success: true, room }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
