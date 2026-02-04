import { env } from "@/lib/env";
import { err } from "@/lib/http";

const readBearer = (authHeader: string | null): string =>
  (authHeader ?? "").replace(/^Bearer\s+/i, "").trim();

export const isAdmin = (authHeader: string | null): boolean => {
  if (!env.demoMode || !env.demoAdminToken) return false;
  return readBearer(authHeader) === env.demoAdminToken;
};

export const isAgent = (agentSecretHeader: string | null): boolean => {
  if (!env.agentSharedSecret) return false;
  return (agentSecretHeader ?? "").trim() === env.agentSharedSecret;
};

export const isTrustedCaller = (req: Request): boolean => {
  return isAdmin(req.headers.get("authorization")) || isAgent(req.headers.get("x-agent-secret"));
};

/**
 * Verify agent secret and return error response if invalid.
 * Returns null if valid, Response if invalid.
 */
export const verifyAgentSecret = (req: Request): Response | null => {
  if (!isAgent(req.headers.get("x-agent-secret"))) {
    return err("Unauthorized: invalid or missing X-Agent-Secret", 401);
  }
  return null;
};
