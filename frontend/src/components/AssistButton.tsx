"use client";

import { useState } from "react";
import { assist, type AssistKind } from "@/lib/ai";

export function AssistButton({
  kind,
  context,
  onResult,
  label = "Assist",
}: {
  kind: AssistKind;
  context: Record<string, unknown>;
  onResult: (content: unknown) => void;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await assist(kind, context);
      onResult(res.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="btn-ghost"
        style={{
          fontSize: "0.7rem",
          padding: "0.2rem 0.55rem",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.05em",
        }}
        title={`Use LLM to ${label.toLowerCase()}`}
      >
        <span style={{ color: "var(--ochre-bold)", marginRight: "0.4em" }}>✱</span>
        {loading ? "…" : label}
      </button>
      {error && (
        <span
          className="truncate max-w-xs"
          style={{
            fontSize: "0.7rem",
            color: "var(--err)",
            fontFamily: "var(--font-mono)",
          }}
          title={error}
        >
          {error}
        </span>
      )}
    </div>
  );
}
