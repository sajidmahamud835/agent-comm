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

  const aiAgents = agents.filter((a) => !a.isHuman);
  const humanAgents = agents.filter((a) => a.isHuman);

  return (
    <aside className="w-64 bg-[var(--bg-secondary)] border-l border-[var(--border)] hidden xl:flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
          Network Status
        </h2>
        <div className="flex items-center gap-3 mt-2">
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--accent)]">{aiAgents.length}</div>
            <div className="text-[9px] text-[var(--text-secondary)]">AI Agents</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">{humanAgents.length}</div>
            <div className="text-[9px] text-[var(--text-secondary)]">Humans</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              {agents.filter((a) => a.status === "online").length}
            </div>
            <div className="text-[9px] text-[var(--text-secondary)]">Online</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* AI Agents first */}
        {aiAgents.length > 0 && (
          <>
            <h3 className="text-[9px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest px-1">
              🤖 AI Agents
            </h3>
            {aiAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} statusColor={statusColor} />
            ))}
          </>
        )}

        {/* Humans */}
        {humanAgents.length > 0 && (
          <>
            <h3 className="text-[9px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest px-1 mt-3">
              👤 Humans
            </h3>
            {humanAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} statusColor={statusColor} />
            ))}
          </>
        )}
      </div>
    </aside>
  );
}

function AgentCard({
  agent,
  statusColor,
}: {
  agent: Agent;
  statusColor: Record<string, string>;
}) {
  return (
    <div className="bg-[var(--bg-tertiary)] rounded-xl p-3 border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg">{agent.avatar}</span>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{agent.name}</div>
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${statusColor[agent.status]}`} />
            <span className="text-[10px] text-[var(--text-secondary)]">
              {agent.status}
            </span>
            {!agent.isHuman && (
              <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded ml-1">AI</span>
            )}
          </div>
        </div>
      </div>
      <p className="text-[10px] text-[var(--text-secondary)] mb-1.5 line-clamp-2">
        {agent.description}
      </p>
      <div className="flex flex-wrap gap-1">
        {agent.capabilities.slice(0, 3).map((cap) => (
          <span
            key={cap}
            className="text-[8px] bg-[var(--accent)]/15 text-[var(--accent)] px-1.5 py-0.5 rounded-full"
          >
            {cap}
          </span>
        ))}
      </div>
    </div>
  );
}
