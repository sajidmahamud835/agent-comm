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
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatArea({
  messages,
  agents,
  room,
  dmAgent,
  currentAgentId,
  onSendMessage,
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
    ? `${dmAgent.status} · ${dmAgent.capabilities.join(", ")}`
    : "";

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <h2 className="font-bold text-lg">{title}</h2>
        <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
        {messages.map((msg, i) => {
          const sender = getAgent(msg.senderId);
          const isMe = msg.senderId === currentAgentId;
          const showHeader =
            i === 0 || messages[i - 1].senderId !== msg.senderId;

          if (msg.type === "system") {
            return (
              <div key={msg.id} className="text-center py-2">
                <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-3 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className="message-enter">
              {showHeader && (
                <div className="flex items-center gap-2 mt-4 mb-1">
                  <span className="text-lg">{sender?.avatar || "❓"}</span>
                  <span
                    className={`font-semibold text-sm ${
                      isMe ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                    }`}
                  >
                    {sender?.name || msg.senderId}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              )}
              <div className="pl-8 text-sm text-[var(--text-primary)] leading-relaxed">
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex gap-3 items-center">
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
            className="flex-1 bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-secondary)]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
