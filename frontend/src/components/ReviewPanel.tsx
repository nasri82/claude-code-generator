"use client";

import { useState } from "react";
import type { Tier } from "@/lib/api";
import { review, type ReviewFinding, type ReviewResponse } from "@/lib/ai";

const KIND_META: Record<
  ReviewFinding["kind"],
  { mark: string; label: string; color: string; bg: string; border: string }
> = {
  missing: {
    mark: "◇",
    label: "missing",
    color: "var(--ochre-bold)",
    bg: "rgba(192,138,48,0.08)",
    border: "rgba(192,138,48,0.4)",
  },
  vague: {
    mark: "…",
    label: "vague",
    color: "var(--ink-muted)",
    bg: "rgba(30,58,95,0.04)",
    border: "var(--rule-hair)",
  },
  risky: {
    mark: "!",
    label: "risky",
    color: "var(--err)",
    bg: "rgba(156,61,42,0.08)",
    border: "rgba(156,61,42,0.4)",
  },
  praise: {
    mark: "✓",
    label: "good",
    color: "var(--ok)",
    bg: "rgba(90,122,63,0.08)",
    border: "rgba(90,122,63,0.4)",
  },
};

export function ReviewPanel({ tier, data }: { tier: Tier; data: unknown }) {
  const [result, setResult] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onReview() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await review(tier, data);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onReview}
          disabled={loading}
          className="btn-ghost"
          style={{ fontSize: "0.8125rem" }}
        >
          <span style={{ color: "var(--ochre-bold)", marginRight: "0.4em" }}>✱</span>
          {loading ? "Reviewing…" : "Review scaffold"}
        </button>
        <span
          style={{
            fontSize: "0.7rem",
            color: "var(--ink-faint)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.03em",
          }}
        >
          LLM reads every plate and flags gaps
        </span>
      </div>

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

      {result && (
        <div className="plate plate-ticked p-5 space-y-4 draw-in">
          <div>
            <div
              className="uppercase mb-1.5"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                color: "var(--ink-faint)",
                letterSpacing: "0.2em",
              }}
            >
              Summary
            </div>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1rem",
                color: "var(--ink)",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {result.summary}
            </p>
          </div>

          {result.findings.length === 0 ? (
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--ink-faint)",
                fontStyle: "italic",
                fontFamily: "var(--font-mono)",
              }}
            >
              no findings
            </p>
          ) : (
            <ul className="space-y-2">
              {result.findings.map((f, i) => {
                const m = KIND_META[f.kind];
                return (
                  <li
                    key={i}
                    className="p-3 rounded-sm"
                    style={{
                      background: m.bg,
                      border: `1px solid ${m.border}`,
                    }}
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <span
                        style={{
                          color: m.color,
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.9rem",
                          lineHeight: 1,
                        }}
                      >
                        {m.mark}
                      </span>
                      <span
                        className="uppercase"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.6rem",
                          color: m.color,
                          letterSpacing: "0.15em",
                        }}
                      >
                        {m.label}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.7rem",
                          color: "var(--ink-faint)",
                        }}
                      >
                        {f.where}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--ink)" }}>
                      {f.what}
                    </div>
                    {f.suggestion && (
                      <div
                        className="mt-1.5 pl-2"
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--ink-muted)",
                          borderLeft: "2px solid var(--rule-hair)",
                          paddingLeft: "0.625rem",
                          fontStyle: "italic",
                        }}
                      >
                        {f.suggestion}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
