import { Agent, Message, Room } from "@/types";
import crypto from "crypto";
import { getDb } from "./db";

// --- Helpers ---

function sanitizeAgent(a: Agent): Agent {
  return { ...a, apiKey: "[redacted]" };
}

async function ensureSeeded() {
  const db = await getDb();
  const agentCount = await db.collection("agents").countDocuments();
  if (agentCount > 0) return;

  const now = Date.now();

  const systemAgent: Agent = {
    id: "system",
    name: "System",
    avatar: "📡",
    status: "online",
    description: "AgentComm system process",
    capabilities: ["routing", "broadcast"],
    apiKey: "",
    lastSeen: now,
    createdAt: now,
  };

  await db.collection("agents").insertOne({ ...systemAgent, _key: systemAgent.id });

  const defaultRooms: Room[] = [
    { id: "lobby", name: "Lobby", description: "Public room — all agents join automatically", members: ["system"], createdAt: now, lastActivity: now, isPublic: true, type: "group" },
    { id: "tasks", name: "Task Board", description: "Post and claim tasks across agents", members: ["system"], createdAt: now, lastActivity: now, isPublic: true, type: "task" },
    { id: "status", name: "Status Updates", description: "Agent status broadcasts", members: ["system"], createdAt: now, lastActivity: now, isPublic: true, type: "broadcast" },
  ];

  await db.collection("rooms").insertMany(defaultRooms.map((r) => ({ ...r, _key: r.id })));

  await db.collection("messages").insertOne({
    id: "msg-welcome",
    senderId: "system",
    content: "AgentComm is online. Agents can register via POST /api/v1/agents/register",
    timestamp: now,
    roomId: "lobby",
    type: "system",
  });

  // Create indexes
  await db.collection("agents").createIndex({ id: 1 }, { unique: true });
  await db.collection("rooms").createIndex({ id: 1 }, { unique: true });
  await db.collection("messages").createIndex({ roomId: 1, timestamp: -1 });
  await db.collection("messages").createIndex({ senderId: 1, recipientId: 1, timestamp: -1 });
  await db.collection("apikeys").createIndex({ key: 1 }, { unique: true });
  await db.collection("webhooks").createIndex({ agentId: 1 });
}

// --- Agents ---

export async function getAgents(): Promise<Agent[]> {
  await ensureSeeded();
  const db = await getDb();
  const agents = await db.collection("agents").find({}).toArray();
  return agents.map((a) => sanitizeAgent(a as unknown as Agent));
}

export async function getAgent(id: string): Promise<Agent | undefined> {
  await ensureSeeded();
  const db = await getDb();
  const a = await db.collection("agents").findOne({ id });
  return a ? sanitizeAgent(a as unknown as Agent) : undefined;
}

export async function registerAgent(
  name: string,
  description: string,
  capabilities: string[],
  avatar?: string,
  isHuman?: boolean
): Promise<{ agent: Agent; apiKey: string }> {
  await ensureSeeded();
  const db = await getDb();
  const id = `agent-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;
  const plainKey = `ac_${crypto.randomBytes(24).toString("hex")}`;
  const hashedKey = crypto.createHash("sha256").update(plainKey).digest("hex");

  const agent: Agent = {
    id,
    name,
    avatar: avatar || (isHuman ? "👤" : "🤖"),
    status: "online",
    description,
    capabilities,
    apiKey: hashedKey,
    lastSeen: Date.now(),
    createdAt: Date.now(),
    isHuman,
  };

  await db.collection("agents").insertOne({ ...agent });
  await db.collection("apikeys").insertOne({ key: plainKey, agentId: id });

  // Auto-join lobby
  await db.collection("rooms").updateOne(
    { id: "lobby" },
    { $addToSet: { members: id } }
  );

  await db.collection("messages").insertOne({
    id: `msg-join-${id}`,
    senderId: "system",
    content: `${agent.avatar} ${agent.name} has joined the network${isHuman ? " (human)" : ""}`,
    timestamp: Date.now(),
    roomId: "lobby",
    type: "system",
  });

  return { agent: sanitizeAgent(agent), apiKey: plainKey };
}

export async function authenticateAgent(apiKey: string): Promise<string | null> {
  await ensureSeeded();
  const db = await getDb();
  const record = await db.collection("apikeys").findOne({ key: apiKey });
  if (record) {
    await db.collection("agents").updateOne(
      { id: record.agentId },
      { $set: { lastSeen: Date.now(), status: "online" } }
    );
    return record.agentId as string;
  }
  return null;
}

export async function updateAgentStatus(agentId: string, status: Agent["status"]): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("agents").updateOne(
    { id: agentId },
    { $set: { status, lastSeen: Date.now() } }
  );
  return result.matchedCount > 0;
}

// --- Rooms ---

export async function getRooms(): Promise<Room[]> {
  await ensureSeeded();
  const db = await getDb();
  const rooms = await db.collection("rooms").find({}).toArray();
  return rooms as unknown as Room[];
}

export async function getRoom(id: string): Promise<Room | undefined> {
  await ensureSeeded();
  const db = await getDb();
  const room = await db.collection("rooms").findOne({ id });
  return room ? (room as unknown as Room) : undefined;
}

export async function createRoom(name: string, description: string, type: Room["type"], creatorId: string, isPublic = true): Promise<Room> {
  const db = await getDb();
  const id = `room-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;
  const room: Room = { id, name, description, members: [creatorId], createdAt: Date.now(), lastActivity: Date.now(), isPublic, type };
  await db.collection("rooms").insertOne({ ...room });
  return room;
}

export async function joinRoom(roomId: string, agentId: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("rooms").updateOne(
    { id: roomId },
    { $addToSet: { members: agentId } }
  );
  return result.matchedCount > 0;
}

export async function leaveRoom(roomId: string, agentId: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("rooms").updateOne(
    { id: roomId },
    { $pull: { members: agentId } as any }
  );
  return result.matchedCount > 0;
}

// --- Messages ---

export async function getMessages(opts: {
  roomId?: string;
  recipientId?: string;
  senderId?: string;
  since?: number;
  limit?: number;
}): Promise<Message[]> {
  await ensureSeeded();
  const { roomId, recipientId, senderId, since, limit = 100 } = opts;
  const db = await getDb();

  const filter: any = {};
  if (roomId) {
    filter.roomId = roomId;
  } else if (recipientId && senderId) {
    filter.$or = [
      { recipientId, senderId },
      { recipientId: senderId, senderId: recipientId },
    ];
  }
  if (since) {
    filter.timestamp = { $gt: since };
  }

  const messages = await db
    .collection("messages")
    .find(filter)
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();

  return messages.reverse() as unknown as Message[];
}

export async function addMessage(msg: Omit<Message, "id" | "timestamp">): Promise<Message> {
  const db = await getDb();
  const fullMsg: Message = {
    ...msg,
    id: `msg-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    timestamp: Date.now(),
  };

  await db.collection("messages").insertOne({ ...fullMsg });

  if (fullMsg.roomId) {
    await db.collection("rooms").updateOne(
      { id: fullMsg.roomId },
      { $set: { lastActivity: fullMsg.timestamp } }
    );
  }

  return fullMsg;
}

// --- Webhooks ---

export async function registerWebhook(agentId: string, url: string): Promise<void> {
  const db = await getDb();
  await db.collection("webhooks").updateOne(
    { agentId },
    { $addToSet: { urls: url } },
    { upsert: true }
  );
}

export async function getWebhooks(agentId: string): Promise<string[]> {
  const db = await getDb();
  const record = await db.collection("webhooks").findOne({ agentId });
  return record?.urls || [];
}
