export interface Agent {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "busy";
  description: string;
  capabilities: string[];
  lastSeen: number;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  roomId?: string;
  recipientId?: string; // for P2P
  type: "text" | "system" | "action";
}

export interface Room {
  id: string;
  name: string;
  description: string;
  members: string[];
  createdAt: number;
  lastActivity: number;
  isPublic: boolean;
}

export interface DirectConversation {
  agentId: string;
  lastMessage?: Message;
  unreadCount: number;
}
