"use client";

import { Agent, Room } from "@/types";

interface SidebarProps {
  agents: Agent[];
  rooms: Room[];
  activeView: { type: "room" | "dm"; id: string };
  onSelectRoom: (roomId: string) => void;
  onSelectDM: (agentId: string) => void;
  currentAgentId: string;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({
  agents,
  rooms,
  activeView,
  onSelectRoom,
  onSelectDM,
  currentAgentId,
  open,
  onClose,
}: SidebarProps) {
  const statusColor = {
    online: "bg-green-500",
    busy: "bg-yellow-500",
    offline: "bg-zinc-500",
  };

  const aiAgents = agents.filter((a) => !a.isHuman);
  const humanAgents = agents.filter((a) => a.isHuman && a.id !== currentAgentId);

  const handleSelect = (type: "room" | "dm", id: string) => {
    if (type === "room") onSelectRoom(id);
    else onSelectDM(id);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:relative z-50 md:z-auto top-0 left-0 h-full w-72 bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <span className="text-2xl">📡</span> AgentComm
            </h1>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 uppercase tracking-wider">
              Agent Communication Hub
            </p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Rooms */}
          <div className="p-3">
            <h2 className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-2 px-1">
              Rooms
            </h2>
            {rooms.map((room) => {
              const aiCount = room.members.filter((m) =>
                aiAgents.some((a) => a.id === m)
              ).length;
              return (
                <button
                  key={room.id}
                  onClick={() => handleSelect("room", room.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 flex items-center gap-2.5 transition-colors ${
                    activeView.type === "room" && activeView.id === room.id
                      ? "bg-[var(--accent)] text-white"
                      : "hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                  }`}
                >
                  <span className="text-base opacity-70">#</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{room.name}</div>
                    <div className="text-[10px] text-[var(--text-secondary)] truncate flex items-center gap-1">
                      {aiCount > 0 && <span>🤖 {aiCount}</span>}
                      <span>· {room.members.length} members</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* AI Agents */}
          {aiAgents.length > 0 && (
            <div className="p-3 border-t border-[var(--border)]">
              <h2 className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-2 px-1">
                🤖 AI Agents
              </h2>
              {aiAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleSelect("dm", agent.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-0.5 flex items-center gap-2.5 transition-colors ${
                    activeView.type === "dm" && activeView.id === agent.id
                      ? "bg-[var(--accent)] text-white"
                      : "hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                  }`}
                >
                  <div className="relative">
                    <span className="text-lg">{agent.avatar}</span>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--bg-secondary)] ${statusColor[agent.status]}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{agent.name}</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">{agent.status}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Human Agents */}
          {humanAgents.length > 0 && (
            <div className="p-3 border-t border-[var(--border)]">
              <h2 className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-2 px-1">
                👤 Humans
              </h2>
              {humanAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleSelect("dm", agent.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-0.5 flex items-center gap-2.5 transition-colors ${
                    activeView.type === "dm" && activeView.id === agent.id
                      ? "bg-[var(--accent)] text-white"
                      : "hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                  }`}
                >
                  <div className="relative">
                    <span className="text-lg">{agent.avatar}</span>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--bg-secondary)] ${statusColor[agent.status]}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{agent.name}</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">{agent.status}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current user */}
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
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{current.name}</div>
                  <div className="text-[10px] text-green-400">
                    {current.isHuman ? "Human · Online" : "Agent · Online"}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </aside>
    </>
  );
}
