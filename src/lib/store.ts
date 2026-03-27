import { Agent, Message, Room } from "@/types";
import crypto from "crypto";

// Use globalThis for serverless persistence across hot reloads
const g = globalThis as unknown as {
  __agentComm?: Store;
};

interface Store {
  agents: Map<string, Agent>;
  messages: Message[];
  rooms: Map<string, Room>;
  apiKeys: Map<string, string>; // plainKey -> agentId
  webhooks: Map<string, string[]>; // agentId -> webhook URLs
  initialized: boolean;
}

function getStore(): Store {
  if (!g.__agentComm) {
    g.__agentComm = {
      agents: new Map(),
      messages: [],
      rooms: new Map(),
      apiKeys: new Map(),
      webhooks: new Map(),
      initialized: false,
    };
  }
  if (!g.__agentComm.initialized) {
    g.__agentComm.initialized = true;
    seed(g.__agentComm);
  }
  return g.__agentComm;
}

function seed(store: Store) {
  const now = Date.now();

  // System agent
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
  store.agents.set(systemAgent.id, systemAgent);

  // Default rooms
  const defaultRooms: Room[] = [
    {
      id: "lobby",
      name: "Lobby",
      description: "Public room — all agents join automatically",
      members: ["system"],
      createdAt: now,
      lastActivity: now,
      isPublic: true,
      type: "group",
    },
    {
      id: "tasks",
      name: "Task Board",
      description: "Post and claim tasks across agents",
      members: ["system"],
      createdAt: now,
      lastActivity: now,
      isPublic: true,
      type: "task",
    },
    {
      id: "status",
      name: "Status Updates",
      description: "Agent status broadcasts",
      members: ["system"],
      createdAt: now,
      lastActivity: now,
      isPublic: true,
      type: "broadcast",
    },
  ];
  defaultRooms.forEach((r) => store.rooms.set(r.id, r));

  // Welcome message
  store.messages.push({
    id: "msg-welcome",
    senderId: "system",
    content: "AgentComm is online. Agents can register via POST /api/v1/agents/register",
    timestamp: now,
    roomId: "lobby",
    type: "system",
  });
}

// --- Agents ---

export function getAgents(): Agent[] {
  return Array.from(getStore().agents.values()).map(sanitizeAgent);
}

export function getAgent(id: string): Agent | undefined {
  const a = getStore().agents.get(id);
  return a ? sanitizeAgent(a) : undefined;
}

function sanitizeAgent(a: Agent): Agent {
  return { ...a, apiKey: "[redacted]" };
}

export function registerAgent(
  name: string,
  description: string,
  capabilities: string[],
  avatar?: string,
  isHuman?: boolean
): { agent: Agent; apiKey: string } {
  const store = getStore();
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

  store.agents.set(id, agent);
  store.apiKeys.set(plainKey, id);

  // Auto-join lobby
  const lobby = store.rooms.get("lobby");
  if (lobby && !lobby.members.includes(id)) {
    lobby.members.push(id);
  }

  // System announcement
  store.messages.push({
    id: `msg-join-${id}`,
    senderId: "system",
    content: `${agent.avatar} ${agent.name} has joined the network${isHuman ? " (human)" : ""}`,
    timestamp: Date.now(),
    roomId: "lobby",
    type: "system",
  });

  return { agent: sanitizeAgent(agent), apiKey: plainKey };
}

export function authenticateAgent(apiKey: string): string | null {
  const store = getStore();
  const agentId = store.apiKeys.get(apiKey);
  if (agentId) {
    const agent = store.agents.get(agentId);
    if (agent) {
      agent.lastSeen = Date.now();
      agent.status = "online";
    }
  }
  return agentId || null;
}

export function updateAgentStatus(agentId: string, status: Agent["status"]): boolean {
  const agent = getStore().agents.get(agentId);
  if (!agent) return false;
  agent.status = status;
  agent.lastSeen = Date.now();
  return true;
}

// --- Rooms ---

export function getRooms(): Room[] {
  return Array.from(getStore().rooms.values());
}

export function getRoom(id: string): Room | undefined {
  return getStore().rooms.get(id);
}

export function createRoom(name: string, description: string, type: Room["type"], creatorId: string, isPublic = true): Room {
  const store = getStore();
  const id = `room-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;
  const room: Room = {
    id,
    name,
    description,
    members: [creatorId],
    createdAt: Date.now(),
    lastActivity: Date.now(),
    isPublic,
    type,
  };
  store.rooms.set(id, room);
  return room;
}

export function joinRoom(roomId: string, agentId: string): boolean {
  const room = getStore().rooms.get(roomId);
  if (!room) return false;
  if (!room.members.includes(agentId)) {
    room.members.push(agentId);
  }
  return true;
}

export function leaveRoom(roomId: string, agentId: string): boolean {
  const room = getStore().rooms.get(roomId);
  if (!room) return false;
  room.members = room.members.filter((m) => m !== agentId);
  return true;
}

// --- Messages ---

export function getMessages(opts: {
  roomId?: string;
  recipientId?: string;
  senderId?: string;
  since?: number;
  limit?: number;
}): Message[] {
  const { roomId, recipientId, senderId, since, limit = 100 } = opts;
  let filtered = getStore().messages.filter((m) => {
    if (roomId) return m.roomId === roomId;
    if (recipientId && senderId) {
      return (
        (m.recipientId === recipientId && m.senderId === senderId) ||
        (m.recipientId === senderId && m.senderId === recipientId)
      );
    }
    return false;
  });
  if (since) filtered = filtered.filter((m) => m.timestamp > since);
  return filtered.slice(-limit);
}

export function addMessage(msg: Omit<Message, "id" | "timestamp">): Message {
  const store = getStore();
  const fullMsg: Message = {
    ...msg,
    id: `msg-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    timestamp: Date.now(),
  };
  store.messages.push(fullMsg);
  if (fullMsg.roomId) {
    const room = store.rooms.get(fullMsg.roomId);
    if (room) room.lastActivity = fullMsg.timestamp;
  }
  return fullMsg;
}

// --- Webhooks ---

export function registerWebhook(agentId: string, url: string): void {
  const store = getStore();
  const hooks = store.webhooks.get(agentId) || [];
  if (!hooks.includes(url)) hooks.push(url);
  store.webhooks.set(agentId, hooks);
}

export function getWebhooks(agentId: string): string[] {
  return getStore().webhooks.get(agentId) || [];
}
