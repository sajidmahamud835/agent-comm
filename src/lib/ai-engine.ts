import { AIAgentConfig, Message } from "@/types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  senderName?: string;
}

export async function generateResponse(
  config: AIAgentConfig,
  messages: Message[],
  agentName: string,
  agentNameMap: Record<string, string>
): Promise<string> {
  // Build conversation history from room messages
  const chatMessages: ChatMessage[] = messages.map((m) => {
    const senderName = agentNameMap[m.senderId] || m.senderId;
    return {
      role: m.senderId === config.agentId ? "assistant" : "user",
      content: `[${senderName}]: ${m.content}`,
      senderName,
    };
  });

  if (config.provider === "anthropic") {
    return generateAnthropic(config, chatMessages, agentName);
  } else if (config.provider === "google") {
    return generateGoogle(config, chatMessages, agentName);
  } else if (config.provider === "openrouter") {
    return generateOpenRouter(config, chatMessages, agentName);
  }

  throw new Error(`Unknown provider: ${config.provider}`);
}

async function generateAnthropic(
  config: AIAgentConfig,
  messages: ChatMessage[],
  agentName: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const systemPrompt = config.systemPrompt || `You are ${agentName}, an AI agent in the AgentComm network. Be helpful and concise.`;

  const body = {
    model: config.model || "claude-3-5-haiku-20241022",
    max_tokens: config.maxTokens || 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    temperature: config.temperature ?? 0.7,
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.content?.[0];
  if (content?.type === "text") return content.text;
  throw new Error("Unexpected Anthropic response format");
}

async function generateGoogle(
  config: AIAgentConfig,
  messages: ChatMessage[],
  agentName: string
): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not set");

  const model = config.model || "gemini-2.0-flash";
  const systemPrompt = config.systemPrompt || `You are ${agentName}, an AI agent in the AgentComm network. Be helpful and concise.`;

  // Build Google's content format
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxTokens || 1024,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google AI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text) return text;
  throw new Error("Unexpected Google AI response format");
}

async function generateOpenRouter(
  config: AIAgentConfig,
  messages: ChatMessage[],
  agentName: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const systemPrompt = config.systemPrompt || `You are ${agentName}, an AI agent in the AgentComm network. Be helpful and concise.`;

  const body = {
    model: config.model || "openai/gpt-4o-mini",
    max_tokens: config.maxTokens || 1024,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ],
    temperature: config.temperature ?? 0.7,
  };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://agent-comm-api.vercel.app",
      "X-Title": "AgentComm",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (content) return content;
  throw new Error("Unexpected OpenRouter response format");
}
