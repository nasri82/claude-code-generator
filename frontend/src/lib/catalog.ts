/**
 * Claude Code feature catalog — fetched once per page load, cached
 * in-module. The backend merges the canonical catalog with any local
 * extensions, so everything the form needs (hook events, tool names,
 * MCP transports, frontmatter fields) flows through this one endpoint.
 */
import { API_BASE } from "./api";

export interface HookEvent {
  id: string;
  summary?: string;
  since?: string;
}

export interface Catalog {
  version?: string;
  hook_events: HookEvent[];
  built_in_tools: string[];
  mcp_transports: string[];
  frontmatter_fields: Record<string, string[]>;
}

let cached: Catalog | null = null;
let inflight: Promise<Catalog> | null = null;

export async function getCatalog(): Promise<Catalog> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const r = await fetch(`${API_BASE}/api/catalog`);
      if (!r.ok) throw new Error(`Catalog failed (${r.status})`);
      const data = (await r.json()) as Catalog;
      cached = data;
      return data;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** For tests / dev: drop the in-process cache so the next call re-fetches. */
export function invalidateCatalog(): void {
  cached = null;
}
