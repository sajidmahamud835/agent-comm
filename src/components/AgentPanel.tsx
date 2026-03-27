"use client";

import { Agent } from "@/types";

interface AgentPanelProps {
  agents: Agent[];
}

export default function AgentPanel({ agents }: AgentPanelProps) {
  const statusColor = {
    online: "bg-green-500",
    busy: "bg-yellow-500",
    offline: "bg-zinc-500",
  };

  const statusLabel = {
    online: "Online",
    busy: "Busy",
    offline: "Offline",
  };

  return (
    <aside className="w-64 bg-[var(--bg-secondary)] border-l border-[var(--border)] hidden lg:flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          Agents Online
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-[var(--bg-tertiary)] rounded-xl p-3 border border-[var(--border)]"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{agent.avatar}</span>
              <div>
                <div className="font-medium text-sm">{agent.name}</div>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${statusColor[agent.status]}`}
                  />
                  <span className="text-xs text-[var(--text-secondary)]">
                    {statusLabel[agent.status]}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-2">
              {agent.description}
            </p>
            <div className="flex flex-wrap gap-1">
              {agent.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="text-[10px] bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-0.5 rounded-full"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
