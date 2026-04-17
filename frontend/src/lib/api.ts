/**
 * Backend base URL.
 *
 * We bypass Next.js's rewrite proxy because the dev-server proxy has a short
 * default HTTP timeout (~30s) that kills long-running LLM requests before the
 * backend can respond — the user sees a 500 with no backend traceback because
 * the request never reached Python. Hitting the backend directly removes that
 * failure mode. CORS is configured on the backend for localhost:3000.
 *
 * Override with NEXT_PUBLIC_API_URL when the backend lives elsewhere.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Tier = "beginner" | "intermediate" | "expert";

export type PreviewFile = {
  path: string;
  content: string;
  language: string;
};

export type PreviewResponse = {
  files: PreviewFile[];
};

export async function preview(tier: Tier, data: unknown): Promise<PreviewResponse> {
  const res = await fetch(`${API_BASE}/api/preview/${tier}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Preview failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function generate(tier: Tier, data: unknown): Promise<void> {
  const res = await fetch(`${API_BASE}/api/generate/${tier}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Generate failed (${res.status}): ${text}`);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? `${tier}-claude.zip`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
