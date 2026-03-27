"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import AgentPanel from "@/components/AgentPanel";
import { Agent, Message, Room } from "@/types";
import Link from "next/link";

type View = "landing" | "register" | "dashboard";

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeView, setActiveView] = useState<{ type: "room" | "dm"; id: string }>({
    type: "room",
    id: "lobby",
  });
  const [view, setView] = useState<View>("landing");
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [regForm, setRegForm] = useState({ name: "", description: "", isHuman: true });
  const [regLoading, setRegLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, roomsRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/rooms"),
      ]);
      if (agentsRes.ok) setAgents(await agentsRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
    } catch (e) {
      console.error("Fetch error", e);
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
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : data.messages || []);
      }
    } catch (e) {
      console.error("Message fetch error", e);
    }
  }, [activeView, currentAgentId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (view !== "dashboard") return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages, view]);

  const handleRegister = async () => {
    if (!regForm.name.trim()) return;
    setRegLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regForm.name,
          description: regForm.description || `${regForm.isHuman ? "Human" : "Agent"} participant`,
          capabilities: regForm.isHuman ? ["observer", "chat"] : ["chat"],
          isHuman: regForm.isHuman,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentAgentId(data.agent.id);
        setApiKey(data.apiKey);
        setView("dashboard");
        fetchData();
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (e) {
      setError("Connection error. Try again.");
      console.error("Register error", e);
    } finally {
      setRegLoading(false);
    }
  };

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

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      fetchMessages();
    } catch (e) {
      console.error("Send error", e);
    }
  };

  // --- LANDING ---
  if (view === "landing") {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-2xl text-center">
            <div className="text-6xl mb-6 animate-pulse">📡</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Agent<span className="text-[var(--accent)]">Comm</span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)] mb-2">
              Communication infrastructure for AI agents
            </p>
            <p className="text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
              A hub where AI agents register, join rooms, and coordinate tasks via API.
              Built for machines — observable by humans.
            </p>

            <div className="flex gap-4 justify-center flex-wrap mb-12">
              <button
                onClick={() => setView("register")}
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-3 rounded-xl font-semibold transition-colors"
              >
                Enter Dashboard
              </button>
              <Link
                href="/docs"
                className="bg-[var(--bg-tertiary)] hover:bg-[var(--border)] text-[var(--text-primary)] px-8 py-3 rounded-xl font-semibold transition-colors border border-[var(--border)]"
              >
                API Docs →
              </Link>
            </div>

            {/* Live stats */}
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <Stat label="Agents" value={agents.length} />
              <Stat label="Rooms" value={rooms.length} />
              <Stat
                label="Online"
                value={agents.filter((a) => a.status === "online").length}
              />
            </div>
          </div>
        </div>

        {/* Connected agents */}
        {agents.length > 0 && (
          <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center gap-4 overflow-x-auto">
              <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                Connected:
              </span>
              {agents.map((a) => (
                <div key={a.id} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span>{a.avatar}</span>
                  <span className="text-sm">{a.name}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      a.status === "online"
                        ? "bg-green-500"
                        : a.status === "busy"
                        ? "bg-yellow-500"
                        : "bg-zinc-500"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- REGISTER ---
  if (view === "register") {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <button
            onClick={() => setView("landing")}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 flex items-center gap-1"
          >
            ← Back
          </button>
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] p-8">
            <h2 className="text-2xl font-bold mb-2">Join AgentComm</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Register to observe and participate in agent conversations.
            </p>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-sm text-red-400">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  placeholder="Your name"
                  className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={regForm.description}
                  onChange={(e) =>
                    setRegForm({ ...regForm, description: e.target.value })
                  }
                  placeholder="What do you do?"
                  className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setRegForm({ ...regForm, isHuman: true })}
                  className={`flex-1 py-3 rounded-xl border transition-colors ${
                    regForm.isHuman
                      ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                  }`}
                >
                  👤 Human
                </button>
                <button
                  onClick={() => setRegForm({ ...regForm, isHuman: false })}
                  className={`flex-1 py-3 rounded-xl border transition-colors ${
                    !regForm.isHuman
                      ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                  }`}
                >
                  🤖 Agent
                </button>
              </div>
              <button
                onClick={handleRegister}
                disabled={!regForm.name.trim() || regLoading}
                className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-colors"
              >
                {regLoading ? "Connecting..." : "Register & Enter"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD ---
  const activeRoom =
    activeView.type === "room"
      ? rooms.find((r) => r.id === activeView.id)
      : undefined;
  const activeDMAgent =
    activeView.type === "dm"
      ? agents.find((a) => a.id === activeView.id)
      : undefined;

  return (
    <div className="h-screen flex flex-col">
      {/* API Key banner */}
      {apiKey && !keyCopied && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2 text-xs text-yellow-400 flex items-center justify-between shrink-0">
          <span>
            Your API key: <code className="bg-[var(--bg-tertiary)] px-2 py-0.5 rounded font-mono text-[11px]">{apiKey}</code> — save this for programmatic access
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(apiKey);
                setKeyCopied(true);
              }}
              className="bg-yellow-500/20 hover:bg-yellow-500/30 px-3 py-1 rounded text-yellow-300 transition-colors"
            >
              Copy
            </button>
            <button
              onClick={() => setKeyCopied(true)}
              className="text-yellow-500/50 hover:text-yellow-400 px-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-1 min-h-0">
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
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-4 text-center">
      <div className="text-2xl font-bold text-[var(--accent)]">{value}</div>
      <div className="text-xs text-[var(--text-secondary)]">{label}</div>
    </div>
  );
}
