import { NextRequest } from "next/server";
import { authenticateAgent } from "./store";

export function extractApiKey(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return req.headers.get("x-api-key");
}

export async function requireAuth(req: NextRequest): Promise<{ agentId: string } | { error: string; status: number }> {
  const key = extractApiKey(req);
  if (!key) {
    return { error: "Missing API key. Use Authorization: Bearer <key> or X-API-Key header.", status: 401 };
  }
  const agentId = await authenticateAgent(key);
  if (!agentId) {
    return { error: "Invalid API key.", status: 401 };
  }
  return { agentId };
}
