import { NextRequest, NextResponse } from "next/server";
import { loginHumanAgent } from "@/lib/store";
import { generateUserToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "password is required" }, { status: 400 });
    }

    const result = await loginHumanAgent(email.trim(), password);

    if (!result) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = generateUserToken(result.agent.id);

    return NextResponse.json({
      success: true,
      agent: result.agent,
      apiKey: result.apiKey,
      token,
    });
  } catch (err) {
    console.error("login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
