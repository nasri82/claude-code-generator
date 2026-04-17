import { API_BASE } from "./api";

export type LLMConfig = {
  llm_base_url: string;
  llm_model: string;
  llm_api_key: string;
  llm_timeout: number;
  llm_temperature: number;
  overrides: Record<string, unknown>;
  configured: boolean;
};

export type LLMConfigUpdate = Partial<
  Pick<
    LLMConfig,
    "llm_base_url" | "llm_model" | "llm_api_key" | "llm_timeout" | "llm_temperature"
  >
>;

export type TestResult = {
  ok: boolean;
  latency_ms: number | null;
  model: string | null;
  message: string;
};

export type ModelInfo = { id: string; current: boolean };

export type ModelListResponse = {
  models: ModelInfo[];
  source: string;
  error: string | null;
};

export async function getConfig(): Promise<LLMConfig> {
  const r = await fetch(`${API_BASE}/api/config/llm`);
  if (!r.ok) throw new Error(`Get config failed (${r.status})`);
  return r.json();
}

export async function updateConfig(body: LLMConfigUpdate): Promise<LLMConfig> {
  const r = await fetch(`${API_BASE}/api/config/llm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Update failed (${r.status}): ${t}`);
  }
  return r.json();
}

export async function resetConfig(): Promise<LLMConfig> {
  const r = await fetch(`${API_BASE}/api/config/llm/reset`, { method: "POST" });
  if (!r.ok) throw new Error(`Reset failed (${r.status})`);
  return r.json();
}

export async function testConfig(): Promise<TestResult> {
  const r = await fetch(`${API_BASE}/api/config/llm/test`, { method: "POST" });
  if (!r.ok) throw new Error(`Test failed (${r.status})`);
  return r.json();
}

export async function listModels(): Promise<ModelListResponse> {
  const r = await fetch(`${API_BASE}/api/config/llm/models`);
  if (!r.ok) throw new Error(`List models failed (${r.status})`);
  return r.json();
}
