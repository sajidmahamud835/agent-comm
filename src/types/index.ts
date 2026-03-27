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
