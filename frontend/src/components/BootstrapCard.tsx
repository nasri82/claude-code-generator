"use client";

import { useState } from "react";
import type { Tier } from "@/lib/api";
import { bootstrap } from "@/lib/ai";

export function BootstrapCard<T>({
  tier,
  onFilled,
}: {
  tier: Tier;
  onFilled: (data: T) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    if (description.trim().length < 10) {
      setError("Describe the project in at least a couple of sentences.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await bootstrap<T>(tier, description);
      onFilled(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="plate plate-ticked overflow-hidden"
      style={{ background: "var(--paper-light)" }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
        style={{ transition: "background 120ms ease" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-shadow)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div className="flex items-baseline gap-3">
          <span
            aria-hidden
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--ochre-bold)",
            }}
          >
            ✱
          </span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              fontWeight: 500,
              color: "var(--ink)",
            }}
          >
            Bootstrap from description
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              color: "var(--ink-faint)",
              letterSpacing: "0.05em",
            }}
          >
            let the LLM fill the plates
          </span>
        </div>
        <span
          aria-hidden
          style={{
            color: "var(--prussian)",
            transform: expanded ? "rotate(90deg)" : "rotate(0)",
            transition: "transform 180ms ease",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
          }}
        >
          ▸
        </span>
      </button>

      {expanded && (
        <div
          className="px-4 pb-4 pt-3 space-y-3 border-t draw-in"
          style={{ borderColor: "var(--rule-hair)" }}
        >
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Multi-tenant SaaS for insurance TPAs in Lebanon. FastAPI + Next.js, PostgreSQL with RLS, Celery for async policy-issuance workflows. Needs strict audit logging."
            style={{ fontSize: "0.875rem" }}
          />
          {error && (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--err)",
                whiteSpace: "pre-wrap",
              }}
            >
              {error}
            </div>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={onGenerate}
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? "Drawing up…" : "Generate plates"}
            </button>
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--ink-faint)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.03em",
              }}
            >
              uses local LLM · overwrites existing fields
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
