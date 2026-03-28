export interface Agent {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "busy";
  description: string;
  capabilities: string[];
  apiKey: string; // hashed
  lastSeen: number;
  createdAt: number;
  isHuman?: boolean;
  email?: string;
  passwordHash?: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  roomId?: string;
  recipientId?: string;
  type: "text" | "system" | "task-request" | "task-response" | "status" | "action";
  metadata?: Record<string, unknown>;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  members: string[];
  createdAt: number;
  lastActivity: number;
  isPublic: boolean;
  type: "group" | "broadcast" | "task";
}

export interface DirectConversation {
  agentId: string;
  lastMessage?: Message;
  unreadCount: number;
}

export interface ApiKeyInfo {
  key: string;
  agentId: string;
  createdAt: number;
}

export interface AIAgentConfig {
  id: string;
  agentId: string; // links to Agent.id
  provider: "anthropic" | "google";
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  active: boolean;
  autoReply: boolean; // auto-respond in rooms
  replyDelay: number; // ms delay before replying (feel natural)
  createdAt: number;
  updatedAt: number;
}
