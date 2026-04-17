/**
 * API client for the "What's new" feature.
 *
 * Two-phase design:
 *   getWhatsNew()    -> fast, no LLM, deterministic parse + heuristic tags
 *   classifyRelease() -> slow, optional, LLM refines one release's items
 *
 * Classification is per-release so one slow/broken release doesn't block the
 * others. The caller iterates releases and renders results as each returns.
 */
import { API_BASE } from "./api";

// Per-release timeout. Generous — local 7B models can be slow on first load.
const CLASSIFY_TIMEOUT_MS = 3 * 60 * 1000;

export type Relevance = "high" | "medium" | "low" | "none";
export type Kind =
  | "added"
  | "fixed"
  | "improved"
  | "changed"
  | "removed"
  | "other";

export interface ChangelogItem {
  kind: Kind;
  text: string;
  relevance: Relevance;
  affects: string[];
  summary: string;
  source: "heuristic" | "llm";
}

export interface ChangelogRelease {
  date: string;
  items: ChangelogItem[];
  applied?: boolean;
  applied_at?: number | null;
}

export interface AppliedEntry {
  date: string;
  applied_at: number;
  content_hash: string;
  items: ChangelogItem[];
  note: string;
}

export interface ApplyResponse extends AppliedEntry {
  /** Catalog entries newly added by this apply (already merged and live). */
  catalog_additions: Record<string, unknown>;
  catalog_additions_summary: string;
}

export interface WhatsNewResponse {
  releases: ChangelogRelease[];
  source: string;
  fetched_at: number;
  age_seconds: number;
  content_hash: string;
}

export interface ClassifyResponse {
  date: string;
  items: ChangelogItem[];
  model: string;
}

async function readError(r: Response): Promise<string> {
  let message = `${r.status} ${r.statusText}`;
  try {
    const body = await r.json();
    if (body?.detail) {
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (body.detail.error) {
        message = body.detail.hint
          ? `${body.detail.error} — ${body.detail.hint}`
          : body.detail.error;
      } else {
        message = JSON.stringify(body.detail);
      }
    }
  } catch {
    // fall through with status text
  }
  return message;
}

export async function getWhatsNew(
  force = false,
  signal?: AbortSignal,
): Promise<WhatsNewResponse> {
  const r = await fetch(
    `${API_BASE}/api/whatsnew${force ? "?force=true" : ""}`,
    { signal },
  );
  if (!r.ok) {
    throw new Error(`Fetch failed (${r.status}): ${await readError(r)}`);
  }
  return r.json();
}

export async function classifyRelease(
  release: ChangelogRelease,
  signal?: AbortSignal,
): Promise<ClassifyResponse> {
  const timeoutCtl = new AbortController();
  const timeoutId = setTimeout(() => timeoutCtl.abort(), CLASSIFY_TIMEOUT_MS);
  const combined = signal
    ? anySignal([signal, timeoutCtl.signal])
    : timeoutCtl.signal;

  try {
    const r = await fetch(`${API_BASE}/api/whatsnew/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: release.date, items: release.items }),
      signal: combined,
    });
    if (!r.ok) {
      throw new Error(`Classify failed (${r.status}): ${await readError(r)}`);
    }
    return r.json();
  } catch (e) {
    if (
      (e instanceof DOMException && e.name === "AbortError") ||
      (e instanceof Error && e.name === "AbortError")
    ) {
      throw new Error(
        `Timed out after ${CLASSIFY_TIMEOUT_MS / 1000}s on release ${release.date}. Try a smaller model in Settings.`,
      );
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function applyRelease(
  release: ChangelogRelease,
  contentHash: string,
  note = "",
): Promise<ApplyResponse> {
  const r = await fetch(`${API_BASE}/api/whatsnew/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: release.date,
      items: release.items,
      content_hash: contentHash,
      note,
    }),
  });
  if (!r.ok) {
    throw new Error(`Apply failed (${r.status}): ${await readError(r)}`);
  }
  return r.json();
}

export async function unapplyRelease(date: string): Promise<void> {
  const r = await fetch(
    `${API_BASE}/api/whatsnew/applied/${encodeURIComponent(date)}`,
    { method: "DELETE" },
  );
  if (!r.ok && r.status !== 204) {
    throw new Error(`Unapply failed (${r.status}): ${await readError(r)}`);
  }
}

/** Minimal AbortSignal.any() polyfill. */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const ctl = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      ctl.abort(s.reason);
      return ctl.signal;
    }
    s.addEventListener("abort", () => ctl.abort(s.reason), { once: true });
  }
  return ctl.signal;
}
