import { API_BASE } from "./api";

export type DiscoverCategory =
  | "mcp-server"
  | "skill"
  | "agent"
  | "template"
  | "sdk"
  | "tool";

export type DiscoverItem = {
  id: string;
  name: string;
  description: string;
  url: string;
  repo_url: string | null;
  stars: number | null;
  downloads: number | null;
  category: DiscoverCategory;
  sources: string[];
  language: string | null;
  updated_at: string | null;
  install: string | null;
  author: string | null;
  is_official: boolean;
};

export type DiscoverResponse = {
  items: DiscoverItem[];
  total: number;
  cache_age_seconds: number | null;
  by_source: Record<string, number>;
  by_category: Record<string, number>;
};

export async function fetchDiscover(force = false): Promise<DiscoverResponse> {
  const url = `${API_BASE}/api/discover${force ? "?force=true" : ""}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Discover fetch failed: ${resp.status}`);
  return resp.json();
}
