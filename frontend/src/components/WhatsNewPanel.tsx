"use client";

import { useEffect, useRef, useState } from "react";
import {
  applyRelease,
  classifyRelease,
  getWhatsNew,
  unapplyRelease,
  type ChangelogItem,
  type ChangelogRelease,
  type WhatsNewResponse,
} from "@/lib/whatsnew";
import { invalidateCatalog } from "@/lib/catalog";

const RELEVANCE_META: Record<
  ChangelogItem["relevance"],
  { label: string; color: string; bg: string; border: string; rank: number }
> = {
  high: {
    label: "high",
    color: "var(--err)",
    bg: "rgba(156,61,42,0.08)",
    border: "rgba(156,61,42,0.35)",
    rank: 0,
  },
  medium: {
    label: "med",
    color: "var(--ochre-bold)",
    bg: "rgba(192,138,48,0.1)",
    border: "rgba(192,138,48,0.3)",
    rank: 1,
  },
  low: {
    label: "low",
    color: "var(--prussian-soft)",
    bg: "rgba(30,58,95,0.05)",
    border: "rgba(30,58,95,0.18)",
    rank: 2,
  },
  none: {
    label: "—",
    color: "var(--ink-faint)",
    bg: "transparent",
    border: "var(--rule-hair)",
    rank: 3,
  },
};

const KIND_META: Record<ChangelogItem["kind"], string> = {
  added: "+",
  fixed: "□",
  improved: "›",
  changed: "~",
  removed: "−",
  other: "·",
};

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return mm > 0 ? `${mm}m ${ss.toString().padStart(2, "0")}s` : `${ss}s`;
}

function ItemRow({ item }: { item: ChangelogItem }) {
  const r = RELEVANCE_META[item.relevance];
  return (
    <li
      className="p-3 rounded-sm"
      style={{
        background: r.bg,
        border: `1px solid ${r.border}`,
      }}
    >
      <div className="flex items-baseline gap-3 mb-1 flex-wrap">
        <span
          style={{
            color: "var(--ink-faint)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
            width: "1em",
            display: "inline-block",
          }}
          aria-hidden
          title={item.kind}
        >
          {KIND_META[item.kind]}
        </span>
        <span
          className="uppercase shrink-0"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.15em",
            color: r.color,
            padding: "0.1em 0.4em",
            border: `1px solid ${r.border}`,
            borderRadius: "2px",
          }}
          title={
            item.source === "llm"
              ? "Relevance refined by LLM"
              : "Relevance from keyword heuristic"
          }
        >
          {r.label}
          {item.source === "llm" ? "·ai" : ""}
        </span>
        {item.affects.length > 0 && (
          <span
            className="flex gap-1 flex-wrap"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "var(--prussian)",
            }}
          >
            {item.affects.map((a) => (
              <code
                key={a}
                style={{
                  background: "var(--paper-shadow)",
                  padding: "0.05em 0.3em",
                }}
              >
                {a}
              </code>
            ))}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: "0.875rem",
          color: "var(--ink)",
          lineHeight: 1.5,
        }}
      >
        {item.text}
      </div>
      {item.summary && item.relevance !== "none" && (
        <div
          className="mt-1.5 pl-3"
          style={{
            fontSize: "0.8rem",
            color: "var(--ink-muted)",
            borderLeft: "2px solid var(--rule-hair)",
            paddingLeft: "0.625rem",
            fontStyle: "italic",
          }}
        >
          {item.summary}
        </div>
      )}
    </li>
  );
}

type ReleaseState = "idle" | "refining" | "refined" | "error";
type ApplyState = "idle" | "applying" | "error";

interface ReleaseBlockProps {
  release: ChangelogRelease;
  state: ReleaseState;
  refineError: string | null;
  applyState: ApplyState;
  applyError: string | null;
  onlyRelevant: boolean;
  onRefine: () => void;
  onApply: () => void;
  onUnapply: () => void;
}

function ReleaseBlock({
  release,
  state,
  refineError,
  applyState,
  applyError,
  onlyRelevant,
  onRefine,
  onApply,
  onUnapply,
}: ReleaseBlockProps) {
  const visible = onlyRelevant
    ? release.items.filter((i) => i.relevance !== "none")
    : release.items;
  const sorted = [...visible].sort(
    (a, b) =>
      RELEVANCE_META[a.relevance].rank - RELEVANCE_META[b.relevance].rank,
  );
  const refinedCount = release.items.filter((i) => i.source === "llm").length;

  return (
    <section>
      <div
        className="mb-2 pb-1 border-b flex items-baseline justify-between gap-3 flex-wrap"
        style={{ borderColor: "var(--rule-hair)" }}
      >
        <h3
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--prussian)",
            letterSpacing: "0.1em",
            margin: 0,
            fontWeight: 500,
          }}
        >
          {release.date}
          <span
            className="ml-2"
            style={{
              color: "var(--ink-faint)",
              fontSize: "0.65rem",
              letterSpacing: "0.05em",
            }}
          >
            {release.items.length} item
            {release.items.length === 1 ? "" : "s"}
            {refinedCount > 0 && (
              <>
                {" "}
                · {refinedCount} refined
              </>
            )}
          </span>
          {release.applied && (
            <span
              className="ml-2 uppercase"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.55rem",
                letterSpacing: "0.15em",
                color: "var(--prussian)",
                padding: "0.1em 0.45em",
                border: "1px solid var(--prussian-soft)",
                borderRadius: "2px",
                background: "rgba(30,58,95,0.06)",
              }}
              title={
                release.applied_at
                  ? `Applied ${new Date(release.applied_at * 1000).toLocaleString()}`
                  : "Applied"
              }
            >
              ✓ applied
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onRefine}
            disabled={state === "refining"}
            className="btn-ghost"
            style={{
              fontSize: "0.65rem",
              padding: "0.15rem 0.5rem",
              letterSpacing: "0.1em",
              color:
                state === "refined"
                  ? "var(--ink-muted)"
                  : "var(--prussian)",
            }}
            title={
              state === "refined"
                ? "Re-run LLM refinement"
                : "Ask local LLM to refine this release"
            }
          >
            {state === "refining"
              ? "refining…"
              : state === "refined"
                ? "re-refine"
                : "refine with LLM"}
          </button>
          <button
            type="button"
            onClick={release.applied ? onUnapply : onApply}
            disabled={applyState === "applying"}
            className="btn-ghost"
            style={{
              fontSize: "0.65rem",
              padding: "0.15rem 0.5rem",
              letterSpacing: "0.1em",
              color: release.applied
                ? "var(--ink-muted)"
                : "var(--prussian-bold, var(--prussian))",
              fontWeight: release.applied ? 400 : 500,
            }}
            title={
              release.applied
                ? "Remove from applied list (updates APPLIED_RELEASES.md)"
                : "Mark this release as applied. Persists to disk and updates APPLIED_RELEASES.md."
            }
          >
            {applyState === "applying"
              ? "saving…"
              : release.applied
                ? "unapply"
                : "apply to application"}
          </button>
        </div>
      </div>

      {refineError && (
        <div
          className="plate p-2 mb-2"
          style={{
            borderColor: "var(--err)",
            color: "var(--err)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            whiteSpace: "pre-wrap",
          }}
        >
          {refineError}
        </div>
      )}

      {applyError && (
        <div
          className="plate p-2 mb-2"
          style={{
            borderColor: "var(--err)",
            color: "var(--err)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            whiteSpace: "pre-wrap",
          }}
        >
          {applyError}
        </div>
      )}

      {sorted.length === 0 ? (
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--ink-faint)",
            fontStyle: "italic",
          }}
        >
          {onlyRelevant
            ? "All items filtered out (toggle “show all” to see them)."
            : "No items."}
        </p>
      ) : (
        <ul className="space-y-2 mt-2">
          {sorted.map((item, i) => (
            <ItemRow key={i} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function WhatsNewPanel({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<WhatsNewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlyRelevant, setOnlyRelevant] = useState(true);

  const [refineState, setRefineState] = useState<Record<string, ReleaseState>>(
    {},
  );
  const [refineErrors, setRefineErrors] = useState<Record<string, string>>({});
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchElapsed, setBatchElapsed] = useState(0);

  const [applyState, setApplyState] = useState<Record<string, ApplyState>>({});
  const [applyErrors, setApplyErrors] = useState<Record<string, string>>({});
  const [panelFlash, setPanelFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!panelFlash) return;
    const t = setTimeout(() => setPanelFlash(null), 6000);
    return () => clearTimeout(t);
  }, [panelFlash]);

  const abortRef = useRef<AbortController | null>(null);
  const started = useRef(false);

  async function onFetch(force = false) {
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;

    setLoading(true);
    setError(null);
    try {
      const res = await getWhatsNew(force, ctl.signal);
      setData(res);
      setRefineState({});
      setRefineErrors({});
    } catch (e) {
      if (!ctl.signal.aborted) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setLoading(false);
    }
  }

  async function onRefineOne(release: ChangelogRelease): Promise<boolean> {
    setRefineState((s) => ({ ...s, [release.date]: "refining" }));
    setRefineErrors((e) => {
      const { [release.date]: _removed, ...rest } = e;
      return rest;
    });
    try {
      const res = await classifyRelease(release);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          releases: prev.releases.map((r) =>
            r.date === release.date ? { ...r, items: res.items } : r,
          ),
        };
      });
      setRefineState((s) => ({ ...s, [release.date]: "refined" }));
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setRefineState((s) => ({ ...s, [release.date]: "error" }));
      setRefineErrors((errs) => ({ ...errs, [release.date]: msg }));
      return false;
    }
  }

  async function onRefineAll() {
    if (!data || batchRunning) return;
    setBatchRunning(true);
    setBatchElapsed(0);
    const started = Date.now();
    const interval = setInterval(
      () => setBatchElapsed(Date.now() - started),
      500,
    );
    try {
      for (const release of data.releases) {
        const ok = await onRefineOne(release);
        if (!ok) break;
      }
    } finally {
      clearInterval(interval);
      setBatchRunning(false);
    }
  }

  async function onApplyOne(release: ChangelogRelease) {
    if (!data) return;
    setApplyState((s) => ({ ...s, [release.date]: "applying" }));
    setApplyErrors((e) => {
      const { [release.date]: _removed, ...rest } = e;
      return rest;
    });
    try {
      const res = await applyRelease(release, data.content_hash);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          releases: prev.releases.map((r) =>
            r.date === release.date
              ? { ...r, applied: true, applied_at: res.applied_at }
              : r,
          ),
        };
      });
      setApplyState((s) => ({ ...s, [release.date]: "idle" }));
      // The backend may have extended the feature catalog — drop the
      // frontend's in-module cache so the next tier page fetch sees
      // any new hook events / tools / fields.
      invalidateCatalog();
      const summary = res.catalog_additions_summary;
      if (summary && !summary.startsWith("No new")) {
        setPanelFlash(`${release.date}: ${summary}`);
      } else {
        setPanelFlash(`Applied ${release.date}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setApplyState((s) => ({ ...s, [release.date]: "error" }));
      setApplyErrors((errs) => ({ ...errs, [release.date]: msg }));
    }
  }

  async function onUnapplyOne(release: ChangelogRelease) {
    setApplyState((s) => ({ ...s, [release.date]: "applying" }));
    setApplyErrors((e) => {
      const { [release.date]: _removed, ...rest } = e;
      return rest;
    });
    try {
      await unapplyRelease(release.date);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          releases: prev.releases.map((r) =>
            r.date === release.date
              ? { ...r, applied: false, applied_at: null }
              : r,
          ),
        };
      });
      setApplyState((s) => ({ ...s, [release.date]: "idle" }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setApplyState((s) => ({ ...s, [release.date]: "error" }));
      setApplyErrors((errs) => ({ ...errs, [release.date]: msg }));
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void onFetch(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const relevantCount = data
    ? data.releases.reduce(
        (acc, r) =>
          acc + r.items.filter((i) => i.relevance !== "none").length,
        0,
      )
    : 0;
  const totalCount = data
    ? data.releases.reduce((acc, r) => acc + r.items.length, 0)
    : 0;
  const refinedCount = data
    ? data.releases.reduce(
        (acc, r) => acc + r.items.filter((i) => i.source === "llm").length,
        0,
      )
    : 0;
  const appliedCount = data
    ? data.releases.filter((r) => r.applied).length
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="What's new in Claude Code"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(26,24,21,0.35)" }}
        onClick={onClose}
      />

      <aside
        className="relative h-full w-full max-w-2xl overflow-y-auto draw-in"
        style={{
          background: "var(--paper)",
          borderLeft: "1px solid var(--rule-ink)",
          boxShadow: "-16px 0 32px -16px rgba(0,0,0,0.15)",
        }}
      >
        <header
          className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between gap-4"
          style={{
            background: "var(--paper-light)",
            borderColor: "var(--rule-hair)",
          }}
        >
          <div className="min-w-0">
            <div
              className="uppercase mb-1"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                color: "var(--ink-faint)",
                letterSpacing: "0.25em",
              }}
            >
              Sheet N · Changelog digest
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                margin: 0,
                fontWeight: 500,
                lineHeight: 1.1,
              }}
            >
              What’s new in{" "}
              <span style={{ color: "var(--prussian)" }}>Claude Code</span>
            </h2>
            {data && (
              <p
                className="mt-1"
                style={{
                  fontSize: "0.75rem",
                  color: "var(--ink-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {relevantCount} relevant of {totalCount} items
                {refinedCount > 0 && (
                  <>
                    {" "}
                    · {refinedCount} refined by LLM
                  </>
                )}
                {appliedCount > 0 && (
                  <>
                    {" "}
                    · {appliedCount} applied
                  </>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost shrink-0"
            style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem" }}
            aria-label="Close"
          >
            close ×
          </button>
        </header>

        {panelFlash && (
          <div
            className="mx-6 mt-4 px-3 py-2 rounded-sm flex items-start justify-between gap-2"
            style={{
              background: "rgba(30,58,95,0.06)",
              border: "1px solid var(--prussian-soft)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--prussian)",
            }}
            role="status"
          >
            <span>✱ {panelFlash}</span>
            <button
              type="button"
              onClick={() => setPanelFlash(null)}
              aria-label="Dismiss"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--ink-faint)",
                cursor: "pointer",
                padding: 0,
                fontSize: "0.9rem",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}

        <div className="px-6 py-5 space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => onFetch(true)}
              disabled={loading || batchRunning}
              className="btn-ghost"
              style={{ fontSize: "0.75rem" }}
              title="Force re-fetch from GitHub"
            >
              {loading ? "fetching…" : "refresh"}
            </button>

            <button
              type="button"
              onClick={onRefineAll}
              disabled={!data || loading || batchRunning}
              className="btn-ghost"
              style={{ fontSize: "0.75rem" }}
              title="Ask local LLM to refine relevance + summary for every release"
            >
              {batchRunning
                ? `refining all… ${formatElapsed(batchElapsed)}`
                : "refine all with LLM"}
            </button>

            <label
              className="flex items-center gap-2 m-0"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.8rem",
                color: "var(--ink)",
                textTransform: "none",
                letterSpacing: 0,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={onlyRelevant}
                onChange={(e) => setOnlyRelevant(e.target.checked)}
                className="w-auto"
              />
              hide unrelated
            </label>

            {data && (
              <a
                href={data.source}
                target="_blank"
                rel="noreferrer"
                className="link-ruled ml-auto"
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                }}
              >
                source ↗
              </a>
            )}
          </div>

          {/* Legend */}
          <div
            className="flex flex-wrap gap-3 py-2 text-xs"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--ink-muted)",
            }}
          >
            {(["high", "medium", "low"] as const).map((r) => (
              <span key={r} className="flex items-center gap-1.5">
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.05em 0.4em",
                    border: `1px solid ${RELEVANCE_META[r].border}`,
                    color: RELEVANCE_META[r].color,
                    fontSize: "0.55rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    borderRadius: "2px",
                  }}
                >
                  {RELEVANCE_META[r].label}
                </span>
                <span style={{ fontSize: "0.7rem" }}>
                  {r === "high"
                    ? "changes what we scaffold"
                    : r === "medium"
                      ? "new option worth adopting"
                      : "Claude Code, not scaffold"}
                </span>
              </span>
            ))}
          </div>

          {/* Error from initial fetch */}
          {error && (
            <div
              className="plate p-3"
              style={{
                borderColor: "var(--err)",
                color: "var(--err)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                whiteSpace: "pre-wrap",
              }}
            >
              {error}
            </div>
          )}

          {/* Initial loading */}
          {loading && !data && (
            <div
              className="plate p-5"
              style={{
                color: "var(--ink-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8rem",
              }}
            >
              Fetching changelog from GitHub…
            </div>
          )}

          {/* Data */}
          {data && (
            <div className="space-y-5">
              {data.releases.map((r) => (
                <ReleaseBlock
                  key={r.date}
                  release={r}
                  state={refineState[r.date] ?? "idle"}
                  refineError={refineErrors[r.date] ?? null}
                  applyState={applyState[r.date] ?? "idle"}
                  applyError={applyErrors[r.date] ?? null}
                  onlyRelevant={onlyRelevant}
                  onRefine={() => void onRefineOne(r)}
                  onApply={() => void onApplyOne(r)}
                  onUnapply={() => void onUnapplyOne(r)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
