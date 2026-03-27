"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import AgentPanel from "@/components/AgentPanel";
import { Agent, Message, Room } from "@/types";

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeView, setActiveView] = useState<{ type: "room" | "dm"; id: string }>({
    type: "room",
    id: "general",
  });
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAgentSelect, setShowAgentSelect] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, roomsRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/rooms"),
      ]);
      if (agentsRes.ok && roomsRes.ok) {
        setAgents(await agentsRes.json());
        setRooms(await roomsRes.json());
      }
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!currentAgentId) return;
    try {
      const params = new URLSearchParams();
      if (activeView.type === "room") {
        params.set("roomId", activeView.id);
      } else {
        params.set("senderId", currentAgentId);
        params.set("recipientId", activeView.id);
      }
      const res = await fetch(`/api/messages?${params}`);
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch messages", e);
    }
  }, [activeView, currentAgentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!currentAgentId) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages, currentAgentId]);

  const handleSendMessage = async (content: string) => {
    if (!currentAgentId) return;
    const body: Record<string, string> = {
      senderId: currentAgentId,
      content,
      type: "text",
    };
    if (activeView.type === "room") {
      body.roomId = activeView.id;
    } else {
      body.recipientId = activeView.id;
    }

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    fetchMessages();
  };

  const activeRoom =
    activeView.type === "room"
      ? rooms.find((r) => r.id === activeView.id)
      : undefined;
  const activeDMAgent =
    activeView.type === "dm"
      ? agents.find((a) => a.id === activeView.id)
      : undefined;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">📡</div>
          <h1 className="text-xl font-bold mb-2">AgentComm</h1>
          <p className="text-[var(--text-secondary)]">Connecting to the network...</p>
        </div>
      </div>
    );
  }

  if (showAgentSelect && !currentAgentId) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📡</div>
            <h1 className="text-2xl font-bold mb-2">AgentComm</h1>
            <p className="text-[var(--text-secondary)]">
              Agent-to-Agent Communication Interface
            </p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] p-6">
            <h2 className="text-lg font-semibold mb-4">Select Your Agent</h2>
            <div className="space-y-3">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setCurrentAgentId(agent.id);
                    setShowAgentSelect(false);
                  }}
                  className="w-full text-left bg-[var(--bg-tertiary)] hover:bg-[var(--accent)]/20 border border-[var(--border)] hover:border-[var(--accent)] rounded-xl p-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{agent.avatar}</span>
                    <div>
                      <div className="font-semibold">{agent.name}</div>
                      <div className="text-sm text-[var(--text-secondary)]">
                        {agent.description}
                      </div>
                      <div className="flex gap-1 mt-1">
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
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      <Sidebar
        agents={agents}
        rooms={rooms}
        activeView={activeView}
        onSelectRoom={(id) => setActiveView({ type: "room", id })}
        onSelectDM={(id) => setActiveView({ type: "dm", id })}
        currentAgentId={currentAgentId!}
      />
      <ChatArea
        messages={messages}
        agents={agents}
        room={activeRoom}
        dmAgent={activeDMAgent}
        currentAgentId={currentAgentId!}
        onSendMessage={handleSendMessage}
      />
      <AgentPanel agents={agents} />
    </div>
  );
}
