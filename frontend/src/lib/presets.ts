/**
 * API client for saved form presets.
 */
import { API_BASE, type Tier } from "./api";

export interface PresetSummary {
  id: string;
  name: string;
  tier: Tier;
  created_at: number;
  updated_at: number;
}

export interface PresetFull extends PresetSummary {
  data: Record<string, unknown>;
}

export interface PresetListResponse {
  presets: PresetSummary[];
}

async function readError(r: Response): Promise<string> {
  try {
    const body = await r.json();
    if (typeof body?.detail === "string") return body.detail;
    return JSON.stringify(body);
  } catch {
    return `${r.status} ${r.statusText}`;
  }
}

export async function listPresets(tier?: Tier): Promise<PresetSummary[]> {
  const qs = tier ? `?tier=${encodeURIComponent(tier)}` : "";
  const r = await fetch(`${API_BASE}/api/presets${qs}`);
  if (!r.ok) throw new Error(`List presets failed (${r.status}): ${await readError(r)}`);
  const body = (await r.json()) as PresetListResponse;
  return body.presets;
}

export async function getPreset(id: string): Promise<PresetFull> {
  const r = await fetch(`${API_BASE}/api/presets/${encodeURIComponent(id)}`);
  if (!r.ok) throw new Error(`Load preset failed (${r.status}): ${await readError(r)}`);
  return r.json();
}

export async function savePreset(
  name: string,
  tier: Tier,
  data: Record<string, unknown>,
): Promise<PresetFull> {
  const r = await fetch(`${API_BASE}/api/presets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, tier, data }),
  });
  if (!r.ok) throw new Error(`Save preset failed (${r.status}): ${await readError(r)}`);
  return r.json();
}

export async function deletePreset(id: string): Promise<void> {
  const r = await fetch(`${API_BASE}/api/presets/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!r.ok && r.status !== 204) {
    throw new Error(`Delete preset failed (${r.status}): ${await readError(r)}`);
  }
}
