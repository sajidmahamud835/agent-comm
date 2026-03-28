"use client";

import { useEffect, useRef, useState } from "react";
import { Agent, Message, Room } from "@/types";

interface ChatAreaProps {
  messages: Message[];
  agents: Agent[];
  room?: Room;
  dmAgent?: Agent;
  currentAgentId: string;
  onSendMessage: (content: string) => void;
  onMenuClick: () => void;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const typeColors: Record<string, string> = {
  "task-request": "border-l-2 border-blue-500 pl-3",
  "task-response": "border-l-2 border-green-500 pl-3",
  status: "border-l-2 border-yellow-500 pl-3",
  action: "border-l-2 border-purple-500 pl-3",
};

const typeBadges: Record<string, string> = {
  "task-request": "📋 Task",
  "task-response": "✅ Done",
  status: "📊 Status",
  action: "⚡ Action",
};

export default function ChatArea({
  messages,
  agents,
  room,
  dmAgent,
  currentAgentId,
  onSendMessage,
  onMenuClick,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  const getAgent = (id: string) => agents.find((a) => a.id === id);

  const title = room ? `# ${room.name}` : dmAgent ? `${dmAgent.avatar} ${dmAgent.name}` : "";
  const subtitle = room
    ? room.description
    : dmAgent
    ? `${dmAgent.status}${dmAgent.isHuman ? "" : " · AI Agent"}`
    : "";

  const roomTypeIcon: Record<string, string> = {
    group: "💬",
    broadcast: "📢",
    task: "📋",
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuClick}
            className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h14M3 10h14M3 14h14" />
            </svg>
          </button>
          {room && <span>{roomTypeIcon[room.type] || "💬"}</span>}
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-base truncate">{title}</h2>
            <p className="text-[10px] text-[var(--text-secondary)] truncate">{subtitle}</p>
          </div>
          {room && (
            <span className="text-[10px] bg-[var(--bg-tertiary)] px-2 py-1 rounded text-[var(--text-secondary)] whitespace-nowrap hidden sm:block">
              {room.members.length} members
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <div className="text-4xl mb-3 opacity-30">
                {room ? "🤖" : "✉️"}
              </div>
              <p className="text-[var(--text-secondary)] text-sm">
                {room
                  ? "Agents are standing by. Send a message to start the conversation."
                  : "Start a conversation"}
              </p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => {
          const sender = getAgent(msg.senderId);
          const isMe = msg.senderId === currentAgentId;
          const isAI = sender && !sender.isHuman;
          const showHeader =
            i === 0 || messages[i - 1].senderId !== msg.senderId;

          if (msg.type === "system") {
            return (
              <div key={msg.id} className="text-center py-2 message-enter">
                <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-3 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`message-enter ${typeColors[msg.type] || ""}`}>
              {showHeader && (
                <div className="flex items-center gap-2 mt-4 mb-1 flex-wrap">
                  <span className="text-lg">{sender?.avatar || "❓"}</span>
                  <span
                    className={`font-semibold text-sm ${
                      isMe ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                    }`}
                  >
                    {sender?.name || msg.senderId}
                  </span>
                  {isAI && (
                    <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-medium">
                      AI
                    </span>
                  )}
                  {sender?.isHuman && (
                    <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-medium">
                      human
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    {formatTime(msg.timestamp)}
                  </span>
                  {typeBadges[msg.type] && (
                    <span className="text-[9px] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">
                      {typeBadges[msg.type]}
                    </span>
                  )}
                </div>
              )}
              <div className="pl-8 text-sm text-[var(--text-primary)] leading-relaxed break-words">
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 md:px-6 py-3 border-t border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              room
                ? `Message #${room.name}...`
                : dmAgent
                ? `Message ${dmAgent.name}...`
                : "Type a message..."
            }
            className="flex-1 bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-secondary)] text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-medium transition-colors text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
