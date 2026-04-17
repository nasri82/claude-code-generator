"use client";

import type { ReactNode } from "react";

export function FieldArray({
  label,
  items,
  onAdd,
  onRemove,
  renderItem,
  addLabel = "+ Add",
}: {
  label: string;
  items: unknown[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (index: number) => ReactNode;
  addLabel?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="m-0">{label}</label>
        <button
          type="button"
          onClick={onAdd}
          className="btn-ghost"
          style={{
            fontSize: "0.7rem",
            padding: "0.2rem 0.6rem",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.03em",
          }}
        >
          {addLabel}
        </button>
      </div>

      <div className="space-y-3">
        {items.map((_, i) => (
          <div
            key={i}
            className="relative pl-8 pr-3 py-3 rounded-sm"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--rule-hair)",
            }}
          >
            {/* Item number in the left margin — like a numbered reference */}
            <span
              className="absolute left-2 top-3"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                color: "var(--ink-faint)",
                letterSpacing: "0.05em",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            {/* Remove — small x with mono feel */}
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-2 right-2"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--ink-faint)",
                padding: "0.15rem 0.35rem",
                lineHeight: 1,
                borderRadius: "2px",
                transition: "color 120ms ease, background 120ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--err)";
                e.currentTarget.style.background = "rgba(156,61,42,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--ink-faint)";
                e.currentTarget.style.background = "transparent";
              }}
              aria-label="Remove"
              title="Remove"
            >
              ✕
            </button>

            {renderItem(i)}
          </div>
        ))}

        {items.length === 0 && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--ink-faint)",
              fontFamily: "var(--font-mono)",
              fontStyle: "italic",
              letterSpacing: "0.03em",
            }}
          >
            no entries
          </div>
        )}
      </div>
    </div>
  );
}
