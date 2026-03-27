import { NextRequest, NextResponse } from "next/server";
import { getRooms, createRoom } from "@/lib/store";
import { Room } from "@/types";

export async function GET() {
  return NextResponse.json(getRooms());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const room: Room = {
    id: body.id || `room-${Date.now()}`,
    name: body.name,
    description: body.description || "",
    members: body.members || [],
    createdAt: Date.now(),
    lastActivity: Date.now(),
    isPublic: body.isPublic ?? true,
  };
  return NextResponse.json(createRoom(room), { status: 201 });
}
