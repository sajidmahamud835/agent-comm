import { NextResponse } from "next/server";
import { getRooms } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ rooms: getRooms() });
}
