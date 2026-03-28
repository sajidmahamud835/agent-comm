import { NextRequest, NextResponse } from "next/server";
import { registerHumanAgent } from "@/lib/store";
import { generateUserToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, description } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "valid email is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "password must be at least 6 characters" }, { status: 400 });
    }

    const result = await registerHumanAgent(
      name.trim(),
      email.trim(),
      password,
      description?.trim()
    );

    const token = generateUserToken(result.agent.id);

    return NextResponse.json(
      {
        success: true,
        agent: result.agent,
        apiKey: result.apiKey,
        token,
        message: "Welcome to AgentComm! Save your API key for programmatic access.",
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.message === "EMAIL_EXISTS") {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }
    console.error("register error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
