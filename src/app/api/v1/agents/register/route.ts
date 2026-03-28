import { NextRequest, NextResponse } from "next/server";
import { registerAgent } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, capabilities, avatar, isHuman } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const result = await registerAgent(
      name,
      description || "",
      capabilities || [],
      avatar,
      isHuman
    );

    return NextResponse.json({
      success: true,
      agent: result.agent,
      apiKey: result.apiKey,
      message: "Save your API key — it won't be shown again.",
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
