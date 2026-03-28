import { Agent, AIAgentConfig, Message, Room } from "@/types";
import crypto from "crypto";
import { getDb } from "./db";

// --- Helpers ---

function sanitizeAgent(a: Agent): Agent {
  const clean = { ...a, apiKey: "[redacted]" };
  delete clean.passwordHash;
  return clean;
}

function hashPassword(password: string, email: string): string {
  return crypto
    .pbkdf2Sync(password, email, 100000, 64, "sha512")
    .toString("hex");
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
  await db.collection("agents").createIndex({ email: 1 }, { sparse: true });
  await db.collection("rooms").createIndex({ id: 1 }, { unique: true });
  await db.collection("messages").createIndex({ roomId: 1, timestamp: -1 });
  await db.collection("messages").createIndex({ senderId: 1, recipientId: 1, timestamp: -1 });
  await db.collection("apikeys").createIndex({ key: 1 }, { unique: true });
  await db.collection("webhooks").createIndex({ agentId: 1 });
  await db.collection("aiagents").createIndex({ id: 1 }, { unique: true });
  await db.collection("aiagents").createIndex({ agentId: 1 }, { unique: true });
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

export async function getAgentByEmail(email: string): Promise<Agent | undefined> {
  await ensureSeeded();
  const db = await getDb();
  const a = await db.collection("agents").findOne({ email: email.toLowerCase() });
  return a ? (a as unknown as Agent) : undefined; // return raw (with passwordHash) for auth purposes
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

export async function registerHumanAgent(
  name: string,
  email: string,
  password: string,
  description?: string
): Promise<{ agent: Agent; apiKey: string }> {
  await ensureSeeded();
  const db = await getDb();

  const normalizedEmail = email.toLowerCase();

  // Check email uniqueness
  const existing = await db.collection("agents").findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error("EMAIL_EXISTS");
  }

  const id = `agent-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;
  const plainKey = `ac_${crypto.randomBytes(24).toString("hex")}`;
  const hashedKey = crypto.createHash("sha256").update(plainKey).digest("hex");
  const passwordHash = hashPassword(password, normalizedEmail);

  const agent: Agent = {
    id,
    name,
    avatar: "👤",
    status: "online",
    description: description || "Human participant",
    capabilities: ["observer", "chat"],
    apiKey: hashedKey,
    lastSeen: Date.now(),
    createdAt: Date.now(),
    isHuman: true,
    email: normalizedEmail,
    passwordHash,
  };

  await db.collection("agents").insertOne({ ...agent });
  await db.collection("apikeys").insertOne({ key: plainKey, agentId: id, createdAt: Date.now() });

  // Auto-join lobby
  await db.collection("rooms").updateOne(
    { id: "lobby" },
    { $addToSet: { members: id } }
  );

  await db.collection("messages").insertOne({
    id: `msg-join-${id}`,
    senderId: "system",
    content: `👤 ${agent.name} has joined the network (human)`,
    timestamp: Date.now(),
    roomId: "lobby",
    type: "system",
  });

  return { agent: sanitizeAgent(agent), apiKey: plainKey };
}

export async function loginHumanAgent(
  email: string,
  password: string
): Promise<{ agent: Agent; apiKey: string } | null> {
  await ensureSeeded();
  const db = await getDb();
  const normalizedEmail = email.toLowerCase();
  const raw = await db.collection("agents").findOne({ email: normalizedEmail });
  if (!raw) return null;

  const agent = raw as unknown as Agent;
  const expectedHash = hashPassword(password, normalizedEmail);
  if (agent.passwordHash !== expectedHash) return null;

  // Get the plain API key from apikeys collection
  const keyRecord = await db.collection("apikeys").findOne({ agentId: agent.id });
  const apiKey = keyRecord?.key as string || "";

  // Update status
  await db.collection("agents").updateOne(
    { id: agent.id },
    { $set: { lastSeen: Date.now(), status: "online" } }
  );

  return { agent: sanitizeAgent(agent), apiKey };
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

export async function updateAgent(agentId: string, updates: Partial<Agent>): Promise<boolean> {
  const db = await getDb();
  // Remove fields that shouldn't be directly updated
  const { id, apiKey, createdAt, passwordHash, email, ...safeUpdates } = updates;
  const result = await db.collection("agents").updateOne(
    { id: agentId },
    { $set: { ...safeUpdates } }
  );
  return result.matchedCount > 0;
}

export async function deleteAgent(agentId: string): Promise<boolean> {
  const db = await getDb();
  await db.collection("apikeys").deleteMany({ agentId });
  await db.collection("rooms").updateMany(
    { members: agentId },
    { $pull: { members: agentId } as any }
  );
  const result = await db.collection("agents").deleteOne({ id: agentId });
  return result.deletedCount > 0;
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

export async function getMessage(id: string): Promise<Message | undefined> {
  const db = await getDb();
  const msg = await db.collection("messages").findOne({ id });
  return msg ? (msg as unknown as Message) : undefined;
}

export async function addReaction(messageId: string, agentId: string, emoji: string): Promise<Record<string, string[]>> {
  const db = await getDb();
  const msg = await db.collection("messages").findOne({ id: messageId });
  if (!msg) throw new Error("Message not found");

  const reactions: Record<string, string[]> = msg.reactions || {};
  if (!reactions[emoji]) {
    reactions[emoji] = [];
  }

  const idx = reactions[emoji].indexOf(agentId);
  if (idx >= 0) {
    reactions[emoji].splice(idx, 1);
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }
  } else {
    reactions[emoji].push(agentId);
  }

  await db.collection("messages").updateOne(
    { id: messageId },
    { $set: { reactions } }
  );

  return reactions;
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

// --- AI Agent Configs ---

export async function getAIAgents(): Promise<AIAgentConfig[]> {
  await ensureSeeded();
  const db = await getDb();
  const configs = await db.collection("aiagents").find({}).toArray();
  return configs as unknown as AIAgentConfig[];
}

export async function getAIAgent(id: string): Promise<AIAgentConfig | undefined> {
  const db = await getDb();
  const c = await db.collection("aiagents").findOne({ id });
  return c ? (c as unknown as AIAgentConfig) : undefined;
}

export async function getAIAgentByAgentId(agentId: string): Promise<AIAgentConfig | undefined> {
  const db = await getDb();
  const c = await db.collection("aiagents").findOne({ agentId });
  return c ? (c as unknown as AIAgentConfig) : undefined;
}

export async function createAIAgent(
  config: Omit<AIAgentConfig, "id" | "createdAt" | "updatedAt">
): Promise<AIAgentConfig> {
  const db = await getDb();
  const now = Date.now();
  const full: AIAgentConfig = {
    ...config,
    id: `ai-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection("aiagents").insertOne({ ...full });
  return full;
}

export async function updateAIAgent(id: string, updates: Partial<AIAgentConfig>): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("aiagents").updateOne(
    { id },
    { $set: { ...updates, updatedAt: Date.now() } }
  );
  return result.matchedCount > 0;
}

export async function deleteAIAgent(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("aiagents").deleteOne({ id });
  return result.deletedCount > 0;
}

export async function getActiveAIAgentsInRoom(roomId: string): Promise<AIAgentConfig[]> {
  const db = await getDb();
  const room = await db.collection("rooms").findOne({ id: roomId });
  if (!room) return [];
  const members: string[] = room.members || [];
  const configs = await db.collection("aiagents").find({
    agentId: { $in: members },
    active: true,
  }).toArray();
  return configs as unknown as AIAgentConfig[];
}
