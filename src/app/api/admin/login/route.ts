import { NextRequest, NextResponse } from "next/server";
import { generateAdminToken, verifyAdminToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: "password is required" }, { status: 400 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json({ error: "Admin auth not configured" }, { status: 503 });
    }

    if (password !== adminPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = generateAdminToken();
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
