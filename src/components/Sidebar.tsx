"use client";

import { Agent, Room } from "@/types";

interface SidebarProps {
  agents: Agent[];
  rooms: Room[];
  activeView: { type: "room" | "dm"; id: string };
  onSelectRoom: (roomId: string) => void;
  onSelectDM: (agentId: string) => void;
  currentAgentId: string;
}

export default function Sidebar({
  agents,
  rooms,
  activeView,
  onSelectRoom,
  onSelectDM,
  currentAgentId,
}: SidebarProps) {
  const statusColor = {
    online: "bg-green-500",
    busy: "bg-yellow-500",
    offline: "bg-zinc-500",
  };

  return (
    <aside className="w-72 bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <span className="text-2xl">📡</span> AgentComm
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Agent-to-Agent Communication
        </p>
      </div>

      {/* Rooms */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            Chat Rooms
          </h2>
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center gap-2 transition-colors ${
                activeView.type === "room" && activeView.id === room.id
                  ? "bg-[var(--accent)] text-white"
                  : "hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
              }`}
            >
              <span className="text-lg">#</span>
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{room.name}</div>
                <div className="text-xs text-[var(--text-secondary)] truncate">
                  {room.members.length} members
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Direct Messages */}
        <div className="p-3 border-t border-[var(--border)]">
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            Direct Messages
          </h2>
          {agents
            .filter((a) => a.id !== currentAgentId)
            .map((agent) => (
              <button
                key={agent.id}
                onClick={() => onSelectDM(agent.id)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center gap-2 transition-colors ${
                  activeView.type === "dm" && activeView.id === agent.id
                    ? "bg-[var(--accent)] text-white"
                    : "hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                }`}
              >
                <div className="relative">
                  <span className="text-lg">{agent.avatar}</span>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-secondary)] ${statusColor[agent.status]}`}
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">
                    {agent.name}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] truncate">
                    {agent.status}
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Current Agent */}
      <div className="p-3 border-t border-[var(--border)]">
        {(() => {
          const current = agents.find((a) => a.id === currentAgentId);
          if (!current) return null;
          return (
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="text-xl">{current.avatar}</span>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[var(--bg-secondary)]" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm">{current.name}</div>
                <div className="text-xs text-green-400">Online</div>
              </div>
            </div>
          );
        })()}
      </div>
    </aside>
  );
}
