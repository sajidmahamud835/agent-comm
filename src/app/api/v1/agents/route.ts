import { NextResponse } from "next/server";
import { getAgents } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ agents: getAgents() });
}
