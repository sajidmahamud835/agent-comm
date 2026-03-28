import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { registerWebhook, getWebhooks } from "@/lib/store";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

    await registerWebhook(auth.agentId, url);
    return NextResponse.json({ success: true, message: "Webhook registered" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  return NextResponse.json({ webhooks: await getWebhooks(auth.agentId) });
}
