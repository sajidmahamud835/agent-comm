"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface AIAgentConfig {
  id: string;
  agentId: string;
  provider: "anthropic" | "google";
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  active: boolean;
  autoReply: boolean;
  replyDelay: number;
  createdAt: number;
  updatedAt: number;
}

interface AgentWithConfig {
  config: AIAgentConfig;
  name: string;
  avatar: string;
  description: string;
  status: string;
}

interface Stats {
  totalAgents: number;
  humanAgents: number;
  aiAgents: number;
  activeAIAgents: number;
  rooms: number;
  messages: number;
  onlineCount: number;
}

interface RoomInfo {
  id: string;
  name: string;
  description: string;
  members: string[];
  type: string;
  lastActivity: number;
}

interface MessageInfo {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  roomId?: string;
  type: string;
}

interface AgentInfo {
  id: string;
  name: string;
  avatar: string;
  status: string;
  description?: string;
  isHuman?: boolean;
}

const ANTHROPIC_MODELS = [
  "claude-sonnet-4-20250514",
  "claude-haiku-35-20241022",
];
const GOOGLE_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-pro",
];

// ─── Main Component ─────────────────────────────────────────────────────────

type Tab = "overview" | "aiagents" | "rooms" | "messages";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("admin_token");
    if (stored) setToken(stored);
  }, []);

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("admin_token", data.token);
        setToken(data.token);
      } else {
        setLoginError(data.error || "Login failed");
      }
    } catch {
      setLoginError("Connection error");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🛡️</div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">AgentComm Control Center</p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] p-6">
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-sm text-red-400">
                {loginError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[var(--text-secondary)] block mb-1">Admin Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  autoFocus
                  className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <button
                onClick={handleLogin}
                disabled={!password || loginLoading}
                className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-colors"
              >
                {loginLoading ? "Authenticating..." : "Enter Admin Panel"}
              </button>
            </div>
          </div>
          <p className="text-center mt-4 text-xs text-[var(--text-secondary)]">
            <a href="/" className="hover:text-[var(--text-primary)] transition-colors">← Back to AgentComm</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Top nav */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl">🛡️</span>
          <span className="font-bold text-lg">AgentComm <span className="text-[var(--accent)]">Admin</span></span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">← Main App</a>
          <button
            onClick={handleLogout}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 flex gap-1">
        {(["overview", "aiagents", "rooms", "messages"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t === "overview" && "📊 Overview"}
            {t === "aiagents" && "🤖 AI Agents"}
            {t === "rooms" && "💬 Rooms"}
            {t === "messages" && "📨 Messages"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {tab === "overview" && <OverviewTab token={token} />}
        {tab === "aiagents" && <AIAgentsTab token={token} />}
        {tab === "rooms" && <RoomsTab token={token} />}
        {tab === "messages" && <MessagesTab token={token} />}
      </div>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ token }: { token: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <ErrorMsg msg="Failed to load stats" />;

  const cards = [
    { label: "Total Agents", value: stats.totalAgents, icon: "📡", color: "text-blue-400" },
    { label: "Human Users", value: stats.humanAgents, icon: "👤", color: "text-green-400" },
    { label: "AI Agents", value: stats.aiAgents, icon: "🤖", color: "text-purple-400" },
    { label: "Active AI", value: stats.activeAIAgents, icon: "⚡", color: "text-yellow-400" },
    { label: "Rooms", value: stats.rooms, icon: "💬", color: "text-cyan-400" },
    { label: "Messages", value: stats.messages, icon: "📨", color: "text-orange-400" },
    { label: "Online Now", value: stats.onlineCount, icon: "🟢", color: "text-green-400" },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">System Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-4">
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI Agents Tab ───────────────────────────────────────────────────────────

function AIAgentsTab({ token }: { token: string }) {
  const [configs, setConfigs] = useState<AIAgentConfig[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<AIAgentConfig | null>(null);
  const [testTarget, setTestTarget] = useState<AIAgentConfig | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [configsRes, agentsRes] = await Promise.all([
      fetch("/api/admin/agents", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/agents"),
    ]);
    if (configsRes.ok) setConfigs(await configsRes.json());
    if (agentsRes.ok) setAgents(await agentsRes.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { reload(); }, [reload]);

  const toggle = async (config: AIAgentConfig) => {
    await fetch(`/api/admin/agents/${config.id}/toggle`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    reload();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/agents/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleteConfirm(null);
    reload();
  };

  const agentMap: Record<string, AgentInfo> = {};
  for (const a of agents) agentMap[a.id] = a;

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">AI Agents ({configs.length})</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          + Create AI Agent
        </button>
      </div>

      {configs.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-secondary)]">
          <div className="text-5xl mb-4 opacity-30">🤖</div>
          <p>No AI agents yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => {
            const agent = agentMap[config.agentId];
            return (
              <div
                key={config.id}
                className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{agent?.avatar || "🤖"}</span>
                    <div className="min-w-0">
                      <div className="font-semibold flex items-center gap-2 flex-wrap">
                        {agent?.name || config.agentId}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.provider === "anthropic" ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"}`}>
                          {config.provider}
                        </span>
                        <span className="text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">
                          {config.model}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                        {agent?.description || "No description"}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1 flex gap-3">
                        <span>temp: {config.temperature}</span>
                        <span>max_tokens: {config.maxTokens}</span>
                        <span>delay: {config.replyDelay}ms</span>
                        <span>auto-reply: {config.autoReply ? "✓" : "✗"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => toggle(config)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.active ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                      }`}
                      title={config.active ? "Active — click to deactivate" : "Inactive — click to activate"}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.active ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className={`text-xs ${config.active ? "text-green-400" : "text-[var(--text-secondary)]"}`}>
                      {config.active ? "Active" : "Off"}
                    </span>
                    <button
                      onClick={() => setTestTarget(config)}
                      className="text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border)] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => setEditTarget(config)}
                      className="text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border)] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(config.id)}
                      className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {/* System prompt preview */}
                <div className="mt-3 text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-lg p-2 line-clamp-2">
                  {config.systemPrompt}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <AIAgentFormModal
          token={token}
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); reload(); }}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <AIAgentFormModal
          token={token}
          config={editTarget}
          agent={agentMap[editTarget.agentId]}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); reload(); }}
        />
      )}

      {/* Test modal */}
      {testTarget && (
        <TestModal
          token={token}
          config={testTarget}
          agentName={agentMap[testTarget.agentId]?.name || "AI Agent"}
          onClose={() => setTestTarget(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete AI Agent"
          message="This will permanently delete the AI agent and its configuration. This cannot be undone."
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

// ─── AI Agent Form Modal ─────────────────────────────────────────────────────

function AIAgentFormModal({
  token,
  config,
  agent,
  onClose,
  onSaved,
}: {
  token: string;
  config?: AIAgentConfig;
  agent?: AgentInfo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!config;

  const [form, setForm] = useState({
    name: agent?.name || "",
    description: agent?.description || "",
    avatar: agent?.avatar || "🤖",
    provider: config?.provider || "anthropic" as "anthropic" | "google",
    model: config?.model || "claude-haiku-35-20241022",
    systemPrompt: config?.systemPrompt || "",
    temperature: config?.temperature ?? 0.7,
    maxTokens: config?.maxTokens ?? 1024,
    active: config?.active ?? true,
    autoReply: config?.autoReply ?? true,
    replyDelay: config?.replyDelay ?? 1000,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const models = form.provider === "anthropic" ? ANTHROPIC_MODELS : GOOGLE_MODELS;

  const handleProviderChange = (p: "anthropic" | "google") => {
    const defaultModel = p === "anthropic" ? ANTHROPIC_MODELS[0] : GOOGLE_MODELS[0];
    setForm({ ...form, provider: p, model: defaultModel });
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      if (isEdit && config) {
        const res = await fetch(`/api/admin/agents/${config.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
      } else {
        const res = await fetch("/api/admin/agents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const AI_AVATARS = ["🧠", "🔮", "⚡", "🎯", "🌟", "🤖", "💡", "🔬", "🎲", "🌀"];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">{isEdit ? "Edit AI Agent" : "Create AI Agent"}</h3>
            <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Avatar picker */}
            <div>
              <label className="text-sm text-[var(--text-secondary)] block mb-2">Avatar</label>
              <div className="flex gap-2 flex-wrap">
                {AI_AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setForm({ ...form, avatar: a })}
                    className={`text-xl p-2 rounded-lg border transition-colors ${
                      form.avatar === a
                        ? "border-[var(--accent)] bg-[var(--accent)]/20"
                        : "border-[var(--border)] hover:border-[var(--text-secondary)]"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <FormField label="Name">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="My AI Agent"
                className={inputCls}
              />
            </FormField>

            <FormField label="Description">
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What does this agent do?"
                className={inputCls}
              />
            </FormField>

            {/* Provider */}
            <FormField label="Provider">
              <div className="flex gap-2">
                {(["anthropic", "google"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleProviderChange(p)}
                    className={`flex-1 py-2 rounded-xl border text-sm transition-colors capitalize ${
                      form.provider === p
                        ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                    }`}
                  >
                    {p === "anthropic" ? "🟠 Anthropic" : "🔵 Google"}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Model */}
            <FormField label="Model">
              <select
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className={inputCls}
              >
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </FormField>

            {/* System Prompt */}
            <FormField label="System Prompt">
              <textarea
                value={form.systemPrompt}
                onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                placeholder={`You are ${form.name || "an AI agent"} in the AgentComm network. Be helpful and concise.`}
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </FormField>

            {/* Temperature */}
            <FormField label={`Temperature: ${form.temperature}`}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </FormField>

            {/* Max Tokens */}
            <FormField label="Max Tokens">
              <input
                type="number"
                value={form.maxTokens}
                onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) })}
                min={64}
                max={4096}
                className={inputCls}
              />
            </FormField>

            {/* Reply Delay */}
            <FormField label={`Reply Delay: ${form.replyDelay}ms`}>
              <input
                type="range"
                min={0}
                max={5000}
                step={250}
                value={form.replyDelay}
                onChange={(e) => setForm({ ...form, replyDelay: parseInt(e.target.value) })}
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                <span>Instant</span>
                <span>5s</span>
              </div>
            </FormField>

            {/* Toggles */}
            <div className="flex gap-4">
              <ToggleField
                label="Active"
                value={form.active}
                onChange={(v) => setForm({ ...form, active: v })}
              />
              <ToggleField
                label="Auto Reply"
                value={form.autoReply}
                onChange={(v) => setForm({ ...form, autoReply: v })}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-[var(--bg-tertiary)] hover:bg-[var(--border)] text-[var(--text-primary)] py-3 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.name || !form.systemPrompt || loading}
              className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-colors"
            >
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Agent"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Test Modal ───────────────────────────────────────────────────────────────

function TestModal({
  token,
  config,
  agentName,
  onClose,
}: {
  token: string;
  config: AIAgentConfig;
  agentName: string;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTest = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const res = await fetch(`/api/admin/agents/${config.id}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (res.ok) {
        setResponse(data.response);
      } else {
        setError(data.error || "Test failed");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] w-full max-w-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Test: {agentName}</h3>
            <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
          </div>

          <div className="text-xs text-[var(--text-secondary)] mb-4 bg-[var(--bg-tertiary)] rounded-lg p-2">
            <span className="font-medium">{config.provider} / {config.model}</span>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a test message..."
              rows={3}
              className={`${inputCls} resize-none w-full`}
            />
            <button
              onClick={handleTest}
              disabled={!prompt.trim() || loading}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              {loading ? "Generating..." : "Send Test"}
            </button>
          </div>

          {response && (
            <div className="mt-4 bg-[var(--bg-tertiary)] rounded-xl p-4">
              <div className="text-xs text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                <span>Response from</span>
                <span className="font-medium text-[var(--text-primary)]">{agentName}</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{response}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Rooms Tab ────────────────────────────────────────────────────────────────

function RoomsTab({ token }: { token: string }) {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [aiConfigs, setAIConfigs] = useState<AIAgentConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [roomsRes, agentsRes, configsRes] = await Promise.all([
      fetch("/api/rooms"),
      fetch("/api/agents"),
      fetch("/api/admin/agents", { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (roomsRes.ok) setRooms(await roomsRes.json());
    if (agentsRes.ok) setAgents(await agentsRes.json());
    if (configsRes.ok) setAIConfigs(await configsRes.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { reload(); }, [reload]);

  const agentMap: Record<string, AgentInfo> = {};
  for (const a of agents) agentMap[a.id] = a;

  // Set of AI agent IDs
  const aiAgentIds = new Set(aiConfigs.map((c) => c.agentId));

  const addToRoom = async (roomId: string, agentId: string) => {
    await fetch("/api/v1/rooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, agentId }),
    });
    reload();
  };

  const removeFromRoom = async (roomId: string, agentId: string) => {
    await fetch("/api/v1/rooms/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, agentId }),
    });
    reload();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Rooms ({rooms.length})</h2>
      <div className="space-y-4">
        {rooms.map((room) => (
          <div key={room.id} className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold flex items-center gap-2">
                  {room.name}
                  <span className="text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">
                    {room.type}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5">{room.description}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">{room.members.length} members</div>
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                {new Date(room.lastActivity).toLocaleString()}
              </div>
            </div>

            {/* Members */}
            <div className="flex flex-wrap gap-2 mb-3">
              {room.members.map((memberId) => {
                const a = agentMap[memberId];
                const isAI = aiAgentIds.has(memberId);
                return (
                  <div key={memberId} className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-lg px-2 py-1">
                    <span className="text-sm">{a?.avatar || "❓"}</span>
                    <span className="text-xs">{a?.name || memberId}</span>
                    {isAI && <span className="text-[10px] text-purple-400">AI</span>}
                    {memberId !== "system" && (
                      <button
                        onClick={() => removeFromRoom(room.id, memberId)}
                        className="text-[10px] text-red-400/60 hover:text-red-400 ml-1 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add AI agents */}
            {aiConfigs.filter((c) => !room.members.includes(c.agentId)).length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[var(--text-secondary)]">Add AI agent:</span>
                {aiConfigs
                  .filter((c) => !room.members.includes(c.agentId))
                  .map((c) => {
                    const a = agentMap[c.agentId];
                    return (
                      <button
                        key={c.id}
                        onClick={() => addToRoom(room.id, c.agentId)}
                        className="text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border)] px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                      >
                        {a?.avatar || "🤖"} {a?.name || c.agentId}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Messages Tab ─────────────────────────────────────────────────────────────

function MessagesTab({ token: _token }: { token: string }) {
  const [messages, setMessages] = useState<MessageInfo[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/messages?limit=100").then((r) => r.json()),
      fetch("/api/agents").then((r) => r.json()),
    ]).then(([msgs, agts]) => {
      setMessages(Array.isArray(msgs) ? msgs.slice(-100).reverse() : []);
      setAgents(agts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const agentMap: Record<string, AgentInfo> = {};
  for (const a of agents) agentMap[a.id] = a;

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Recent Messages</h2>
      <div className="space-y-2">
        {messages.map((msg) => {
          const sender = agentMap[msg.senderId];
          return (
            <div key={msg.id} className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-3 flex items-start gap-3">
              <span className="text-lg shrink-0">{sender?.avatar || "❓"}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{sender?.name || msg.senderId}</span>
                  {msg.roomId && (
                    <span className="text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded">
                      #{msg.roomId}
                    </span>
                  )}
                  <span className="text-xs text-[var(--text-secondary)]">
                    {new Date(msg.timestamp).toLocaleString()}
                  </span>
                  {msg.type !== "text" && (
                    <span className="text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded">
                      {msg.type}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--text-primary)] mt-0.5 break-words">{msg.content}</p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="text-center py-16 text-[var(--text-secondary)]">
            <div className="text-5xl mb-4 opacity-30">📨</div>
            <p>No messages yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Utility Components ───────────────────────────────────────────────────────

const inputCls =
  "w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors text-sm";

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-[var(--text-secondary)] block mb-1">{label}</label>
      {children}
    </div>
  );
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center gap-2 text-sm"
    >
      <div
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          value ? "bg-[var(--accent)]" : "bg-[var(--border)]"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            value ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </div>
      <span className={value ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}>
        {label}
      </span>
    </button>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div className="text-center py-8 text-red-400">{msg}</div>
  );
}

function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] p-6 max-w-sm w-full">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-[var(--bg-tertiary)] hover:bg-[var(--border)] py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
