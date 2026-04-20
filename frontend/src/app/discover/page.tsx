"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { StatusBar } from "@/components/StatusBar";
import { fetchDiscover, type DiscoverItem, type DiscoverResponse } from "@/lib/discover";

/* ── constants ────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { id: "all",        label: "All" },
  { id: "mcp-server", label: "MCP Servers" },
  { id: "skill",      label: "Skills" },
  { id: "agent",      label: "Agents" },
  { id: "sdk",        label: "SDKs" },
  { id: "template",   label: "Templates" },
  { id: "tool",       label: "Tools" },
] as const;

const SORT_OPTIONS = [
  { id: "default",   label: "Relevance" },
  { id: "stars",     label: "Stars" },
  { id: "downloads", label: "Downloads" },
  { id: "updated",   label: "Updated" },
  { id: "name",      label: "A – Z" },
] as const;

type SortId = (typeof SORT_OPTIONS)[number]["id"];

const SOURCES = [
  { id: "all",      label: "All sources" },
  { id: "github",   label: "GitHub" },
  { id: "smithery", label: "Smithery" },
  { id: "glama",    label: "Glama" },
  { id: "npm",      label: "npm" },
] as const;

const SOURCE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  github:   { bg: "rgba(36,41,46,0.08)",   color: "#24292e", border: "rgba(36,41,46,0.2)" },
  smithery: { bg: "rgba(99,102,241,0.08)", color: "#6366f1", border: "rgba(99,102,241,0.25)" },
  glama:    { bg: "rgba(14,165,233,0.08)", color: "#0ea5e9", border: "rgba(14,165,233,0.25)" },
  npm:      { bg: "rgba(203,56,55,0.08)",  color: "#cb3837", border: "rgba(203,56,55,0.25)" },
};

const CATEGORY_LABEL: Record<string, string> = {
  "mcp-server": "MCP Server",
  skill:    "Skill",
  agent:    "Agent",
  template: "Template",
  sdk:      "SDK",
  tool:     "Tool",
};

/* ── helpers ──────────────────────────────────────────────────────────────── */

function fmt(n: number | null): string {
  if (n === null) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600)        return "< 1h ago";
  if (diff < 86400)       return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7)   return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 86400 * 30)  return `${Math.floor(diff / 86400 / 7)}w ago`;
  if (diff < 86400 * 365) return `${Math.floor(diff / 86400 / 30)}mo ago`;
  return `${Math.floor(diff / 86400 / 365)}y ago`;
}

function cacheLabel(age: number | null): string {
  if (age === null) return "not cached";
  if (age < 60)     return "just refreshed";
  if (age < 3600)   return `cached ${Math.floor(age / 60)}m ago`;
  return `cached ${Math.floor(age / 3600)}h ago`;
}

/* ── pill button ──────────────────────────────────────────────────────────── */

function Pill({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.7rem",
        letterSpacing: "0.04em",
        padding:       "0.28rem 0.65rem",
        borderRadius:  "2px",
        border:        active ? "1px solid var(--prussian)" : "1px solid var(--rule-hair)",
        background:    active ? "var(--prussian)" : "transparent",
        color:         active ? "#fff" : "var(--ink-muted)",
        cursor:        "pointer",
        display:       "inline-flex",
        alignItems:    "center",
        gap:           "0.35rem",
        transition:    "background 0.12s, border-color 0.12s, color 0.12s",
        whiteSpace:    "nowrap",
      }}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span style={{ fontSize: "0.58rem", opacity: active ? 0.75 : 0.5 }}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ── filter row label ─────────────────────────────────────────────────────── */

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.58rem",
        letterSpacing: "0.14em",
        color:         "var(--ink-faint)",
        textTransform: "uppercase",
        flexShrink:    0,
        width:         "2.8rem",
        paddingTop:    "0.2rem",
      }}
    >
      {children}
    </span>
  );
}

/* ── item card ────────────────────────────────────────────────────────────── */

function ItemCard({ item }: { item: DiscoverItem }) {
  const [copied, setCopied] = useState(false);

  function copyInstall() {
    if (!item.install) return;
    void navigator.clipboard.writeText(item.install);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article
      className="plate plate-lift flex flex-col gap-3 p-5"
      style={{ background: "var(--paper-light)" }}
    >
      {/* header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* badges */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {item.is_official && (
              <span
                style={{
                  fontFamily:    "var(--font-mono)",
                  fontSize:      "0.52rem",
                  letterSpacing: "0.15em",
                  padding:       "0.1rem 0.4rem",
                  background:    "rgba(192,138,48,0.12)",
                  color:         "var(--ochre-bold)",
                  border:        "1px solid rgba(192,138,48,0.35)",
                  borderRadius:  "2px",
                }}
              >
                OFFICIAL
              </span>
            )}
            <span
              style={{
                fontFamily:    "var(--font-mono)",
                fontSize:      "0.52rem",
                letterSpacing: "0.12em",
                padding:       "0.1rem 0.4rem",
                background:    "rgba(30,58,95,0.07)",
                color:         "var(--prussian)",
                border:        "1px solid rgba(30,58,95,0.18)",
                borderRadius:  "2px",
              }}
            >
              {CATEGORY_LABEL[item.category] ?? item.category}
            </span>
          </div>

          {/* name */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link-ruled"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize:   "0.8125rem",
              fontWeight: 600,
              color:      "var(--ink)",
              wordBreak:  "break-all",
              lineHeight: 1.4,
            }}
          >
            {item.name}
          </a>
        </div>

        {/* star / download counts */}
        <div
          className="shrink-0 text-right"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize:   "0.68rem",
            color:      "var(--ink-faint)",
            lineHeight: 1.7,
          }}
        >
          {item.stars !== null && (
            <div style={{ color: "var(--ochre-bold)" }}>★ {fmt(item.stars)}</div>
          )}
          {item.downloads !== null && <div>↓ {fmt(item.downloads)}</div>}
        </div>
      </div>

      {/* description */}
      {item.description && (
        <p
          style={{
            fontSize:           "0.8rem",
            color:              "var(--ink-muted)",
            lineHeight:         1.55,
            display:            "-webkit-box",
            WebkitLineClamp:    2,
            WebkitBoxOrient:    "vertical" as const,
            overflow:           "hidden",
            margin:             0,
          }}
        >
          {item.description}
        </p>
      )}

      {/* install command */}
      {item.install && (
        <button
          onClick={copyInstall}
          title="Copy install command"
          style={{
            background:     "var(--paper)",
            border:         "1px solid var(--rule-hair)",
            borderRadius:   "2px",
            padding:        "0.35rem 0.6rem",
            fontFamily:     "var(--font-mono)",
            fontSize:       "0.68rem",
            color:          copied ? "var(--ok)" : "var(--ink-muted)",
            cursor:         "pointer",
            textAlign:      "left",
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "center",
            gap:            "0.5rem",
            width:          "100%",
            transition:     "border-color 0.12s, color 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--rule-ink)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.install}
          </span>
          <span style={{ flexShrink: 0, fontSize: "0.75rem", transition: "color 0.12s" }}>
            {copied ? "✓" : "⎘"}
          </span>
        </button>
      )}

      {/* footer: sources + language + date */}
      <div
        className="flex items-center justify-between flex-wrap gap-2 mt-auto pt-2.5 border-t"
        style={{ borderColor: "var(--rule-hair)" }}
      >
        <div className="flex gap-1 flex-wrap items-center">
          {item.sources.map((src) => {
            const s = SOURCE_STYLE[src] ?? { bg: "#66666618", color: "#666", border: "#66666640" };
            return (
              <span
                key={src}
                style={{
                  fontFamily:    "var(--font-mono)",
                  fontSize:      "0.52rem",
                  letterSpacing: "0.1em",
                  padding:       "0.1rem 0.35rem",
                  borderRadius:  "2px",
                  background:    s.bg,
                  color:         s.color,
                  border:        `1px solid ${s.border}`,
                }}
              >
                {src}
              </span>
            );
          })}
          {item.language && (
            <span
              style={{
                fontFamily:   "var(--font-mono)",
                fontSize:     "0.52rem",
                padding:      "0.1rem 0.35rem",
                borderRadius: "2px",
                background:   "var(--paper-shadow)",
                color:        "var(--ink-faint)",
                border:       "1px solid var(--rule-hair)",
              }}
            >
              {item.language}
            </span>
          )}
        </div>
        {item.updated_at && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize:   "0.58rem",
              color:      "var(--ink-faint)",
            }}
          >
            {timeAgo(item.updated_at)}
          </span>
        )}
      </div>
    </article>
  );
}

/* ── skeleton card ────────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <article className="plate p-5 flex flex-col gap-3" aria-hidden>
      {/* badge row */}
      <div className="flex gap-1.5">
        <div className="skeleton-shimmer" style={{ height: "1.1rem", width: "3.5rem" }} />
        <div className="skeleton-shimmer" style={{ height: "1.1rem", width: "4.5rem" }} />
      </div>
      {/* name */}
      <div className="skeleton-shimmer" style={{ height: "0.9rem", width: "65%" }} />
      {/* description lines */}
      <div className="space-y-1.5">
        <div className="skeleton-shimmer" style={{ height: "0.75rem", width: "100%" }} />
        <div className="skeleton-shimmer" style={{ height: "0.75rem", width: "80%" }} />
      </div>
      {/* install bar */}
      <div className="skeleton-shimmer" style={{ height: "2rem", width: "100%" }} />
      {/* footer */}
      <div className="flex gap-1.5 mt-auto pt-2.5 border-t" style={{ borderColor: "var(--rule-hair)" }}>
        <div className="skeleton-shimmer" style={{ height: "1rem", width: "3rem" }} />
        <div className="skeleton-shimmer" style={{ height: "1rem", width: "3rem" }} />
      </div>
      <span className="sr-only">Loading…</span>
    </article>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

export default function DiscoverPage() {
  const [data, setData]           = useState<DiscoverResponse | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [category, setCategory]   = useState("all");
  const [source, setSource]       = useState("all");
  const [query, setQuery]         = useState("");
  const [sort, setSort]           = useState<SortId>("default");

  const load = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const resp = await fetchDiscover(force);
      setData(resp);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo<DiscoverItem[]>(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const base = data.items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (source !== "all" && !item.sources.includes(source)) return false;
      if (q) {
        const hay = `${item.name} ${item.description} ${item.author ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...base].sort((a, b) => {
      switch (sort) {
        case "stars":
          return (b.stars ?? -1) - (a.stars ?? -1);
        case "downloads":
          return (b.downloads ?? -1) - (a.downloads ?? -1);
        case "updated": {
          const da = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const db = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return db - da;
        }
        case "name":
          return a.name.localeCompare(b.name);
        default:
          if (a.is_official !== b.is_official) return a.is_official ? -1 : 1;
          return (b.stars ?? 0) - (a.stars ?? 0) || (b.downloads ?? 0) - (a.downloads ?? 0);
      }
    });
  }, [data, category, source, query, sort]);

  const isFiltered = category !== "all" || source !== "all" || !!query;

  return (
    <>
      <StatusBar />

      <main className="min-h-screen px-6 py-10 max-w-7xl mx-auto">
        {/* back nav */}
        <nav className="mb-5">
          <Link href="/" className="link-ruled text-xs" style={{ fontFamily: "var(--font-mono)" }}>
            ← All tiers
          </Link>
        </nav>

        {/* hero plate */}
        <header
          className="plate plate-ticked p-8 mb-6 draw-in"
          style={{ background: "var(--paper-light)" }}
        >
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div
                className="uppercase mb-2"
                style={{
                  fontFamily:    "var(--font-mono)",
                  fontSize:      "0.68rem",
                  color:         "var(--ink-faint)",
                  letterSpacing: "0.25em",
                }}
              >
                Ecosystem
              </div>
              <h1
                style={{
                  fontFamily:    "var(--font-display)",
                  fontSize:      "clamp(1.75rem, 4vw, 3rem)",
                  lineHeight:    1.05,
                  margin:        0,
                  letterSpacing: "-0.01em",
                }}
              >
                Claude ecosystem
                <br />
                <span style={{ color: "var(--prussian)" }}>discover & explore</span>
              </h1>
              <p
                className="mt-3 max-w-xl"
                style={{ color: "var(--ink-muted)", fontSize: "0.9375rem", lineHeight: 1.6 }}
              >
                MCP servers, skills, agents, SDKs, and templates — sourced from
                GitHub, Smithery, Glama, and npm in real time.
              </p>
            </div>

            {/* stats + refresh */}
            <div className="flex flex-col items-end gap-3">
              {data && (
                <div
                  className="space-y-1 text-right"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--ink-faint)" }}
                >
                  <div style={{ color: "var(--ink-muted)", fontWeight: 500 }}>
                    {data.total} items
                  </div>
                  {Object.entries(data.by_source).map(([src, n]) => (
                    <div key={src}>
                      <span style={{ color: SOURCE_STYLE[src]?.color ?? "inherit" }}>{src}</span>
                      {" · "}{n}
                    </div>
                  ))}
                  <div style={{ fontSize: "0.6rem", marginTop: "0.25rem" }}>
                    {cacheLabel(data.cache_age_seconds)}
                  </div>
                </div>
              )}
              <button
                onClick={() => void load(true)}
                disabled={refreshing || loading}
                className="btn-ghost"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize:   "0.72rem",
                  padding:    "0.35rem 0.85rem",
                  opacity:    refreshing || loading ? 0.5 : 1,
                  cursor:     refreshing || loading ? "not-allowed" : "pointer",
                }}
              >
                {refreshing ? "refreshing…" : "↻ Refresh"}
              </button>
            </div>
          </div>
        </header>

        {/* ── sticky filter bar ── */}
        <div
          className="glass-surface sticky top-0 z-10 -mx-6 px-6 py-3 mb-6"
          style={{ position: "sticky" }}
        >
          <div className="max-w-7xl mx-auto space-y-2.5">

            {/* search */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search by name, description, author…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width:        "100%",
                  fontFamily:   "var(--font-mono)",
                  fontSize:     "0.8125rem",
                  padding:      query ? "0.55rem 2.25rem 0.55rem 0.75rem" : "0.55rem 0.75rem",
                  border:       "1px solid var(--rule-hair)",
                  borderRadius: "2px",
                  background:   "var(--paper)",
                  color:        "var(--ink)",
                  outline:      "none",
                  transition:   "border-color 0.12s",
                }}
                onFocus={(e)  => (e.target.style.borderColor = "var(--prussian)")}
                onBlur={(e)   => (e.target.style.borderColor = "var(--rule-hair)")}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  style={{
                    position:   "absolute",
                    right:      "0.5rem",
                    top:        "50%",
                    transform:  "translateY(-50%)",
                    background: "none",
                    border:     "none",
                    cursor:     "pointer",
                    color:      "var(--ink-faint)",
                    fontSize:   "0.9rem",
                    lineHeight: 1,
                    padding:    "0.2rem",
                    borderRadius: "2px",
                    transition: "color 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-faint)")}
                >
                  ✕
                </button>
              )}
            </div>

            {/* category filter */}
            <div className="flex items-start gap-2 flex-wrap">
              <FilterLabel>Cat</FilterLabel>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <Pill
                    key={c.id}
                    active={category === c.id}
                    onClick={() => setCategory(c.id)}
                    count={c.id === "all" ? undefined : data?.by_category[c.id]}
                  >
                    {c.label}
                  </Pill>
                ))}
              </div>
            </div>

            {/* source filter */}
            <div className="flex items-start gap-2 flex-wrap">
              <FilterLabel>Src</FilterLabel>
              <div className="flex flex-wrap gap-1.5">
                {SOURCES.map((s) => (
                  <Pill
                    key={s.id}
                    active={source === s.id}
                    onClick={() => setSource(s.id)}
                    count={s.id === "all" ? undefined : data?.by_source[s.id]}
                  >
                    {s.label}
                  </Pill>
                ))}
              </div>
            </div>

            {/* sort */}
            <div className="flex items-center gap-2 flex-wrap">
              <FilterLabel>Sort</FilterLabel>
              <div className="flex flex-wrap gap-1.5">
                {SORT_OPTIONS.map((o) => (
                  <Pill
                    key={o.id}
                    active={sort === o.id}
                    onClick={() => setSort(o.id)}
                  >
                    {o.label}
                  </Pill>
                ))}
              </div>

              {/* result count lives here, right-aligned */}
              {!loading && data && (
                <span
                  className="ml-auto"
                  style={{
                    fontFamily:    "var(--font-mono)",
                    fontSize:      "0.65rem",
                    color:         "var(--ink-faint)",
                    whiteSpace:    "nowrap",
                  }}
                >
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                  {isFiltered && ` of ${data.total}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* error */}
        {error && (
          <div
            className="plate p-4 mb-6"
            style={{
              borderColor: "var(--err)",
              color:        "var(--err)",
              fontFamily:  "var(--font-mono)",
              fontSize:    "0.8rem",
            }}
          >
            {error} — check that the backend is running.
          </div>
        )}

        {/* grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="plate p-12 text-center"
            style={{ borderStyle: "dashed" }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize:   "1.5rem",
                fontWeight: 500,
                color:      "var(--ink-faint)",
                marginBottom: "0.5rem",
              }}
            >
              Nothing found
            </div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize:   "0.78rem",
                color:      "var(--ink-faint)",
                maxWidth:   "22rem",
                margin:     "0 auto",
                lineHeight: 1.6,
              }}
            >
              {isFiltered
                ? "Try broadening your filters or clearing the search."
                : "Check that the backend is reachable on localhost:8000."}
            </p>
            {isFiltered && (
              <button
                type="button"
                className="btn-ghost"
                style={{ marginTop: "1.25rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}
                onClick={() => { setCategory("all"); setSource("all"); setQuery(""); }}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
