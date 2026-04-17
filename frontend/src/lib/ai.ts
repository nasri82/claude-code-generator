import { API_BASE, type Tier } from "./api";

export type AIHealth = {
  ok: boolean;
  base_url?: string;
  model?: string;
  error?: string;
  status?: number;
};

export type AssistKind =
  | "skill_body"
  | "agent_prompt"
  | "cross_cutting_rules"
  | "command_body";

export type ReviewFinding = {
  kind: "missing" | "vague" | "risky" | "praise";
  where: string;
  what: string;
  suggestion?: string;
};

export type ReviewResponse = {
  summary: string;
  findings: ReviewFinding[];
};

export async function aiHealth(): Promise<AIHealth> {
  const res = await fetch(`${API_BASE}/api/ai/health`);
  if (!res.ok) throw new Error(`AI health failed (${res.status})`);
  return res.json();
}

export async function bootstrap<T>(tier: Tier, description: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api/ai/bootstrap/${tier}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bootstrap failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function assist(
  kind: AssistKind,
  context: Record<string, unknown>,
): Promise<{ kind: string; content: unknown }> {
  const res = await fetch(`${API_BASE}/api/ai/assist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, context }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Assist failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function review(tier: Tier, data: unknown): Promise<ReviewResponse> {
  const res = await fetch(`${API_BASE}/api/ai/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier, data }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Review failed (${res.status}): ${text}`);
  }
  return res.json();
}
