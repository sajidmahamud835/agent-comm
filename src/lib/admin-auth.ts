import crypto from "crypto";

function getSecret(): string {
  return process.env.ADMIN_PASSWORD || "changeme";
}

export function generateAdminToken(): string {
  const secret = getSecret();
  return crypto.createHmac("sha256", secret).update("admin").digest("hex");
}

export function verifyAdminToken(token: string): boolean {
  const expected = generateAdminToken();
  // Constant-time comparison to prevent timing attacks
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function requireAdmin(req: Request): { error: string; status: number } | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return { error: "Missing admin token", status: 401 };
  }
  const token = auth.slice(7);
  if (!verifyAdminToken(token)) {
    return { error: "Invalid admin token", status: 403 };
  }
  return null;
}

// --- User auth token (for email/password login) ---

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "auth-secret";
}

export function generateUserToken(agentId: string): string {
  const secret = getAuthSecret();
  return crypto.createHmac("sha256", secret).update(agentId).digest("hex");
}

export function verifyUserToken(token: string, agentId: string): boolean {
  const expected = generateUserToken(agentId);
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
