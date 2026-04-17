"use client";

import { useState, type ReactNode } from "react";

export function CollapsibleSection({
  title,
  subtitle,
  count,
  defaultOpen = false,
  children,
  number,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
  /** Optional section number to render like a drafting plate (§1, §2...) */
  number?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasCount = typeof count === "number";

  return (
    <section
      className="plate"
      style={{
        borderColor: open ? "var(--rule-ink)" : "var(--rule-hair)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-baseline gap-3 min-w-0">
          {number && (
            <span
              className="shrink-0"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                color: "var(--ink-faint)",
                letterSpacing: "0.05em",
              }}
            >
              {number}
            </span>
          )}
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.05rem",
              fontWeight: 500,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <span
              className="truncate"
              style={{ color: "var(--ink-faint)", fontSize: "0.8125rem" }}
            >
              {subtitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasCount && count! > 0 && (
            <span
              className="rounded-sm px-1.5 py-0.5"
              style={{
                background: "var(--prussian)",
                color: "var(--paper)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                lineHeight: 1.2,
              }}
            >
              {count}
            </span>
          )}
          {hasCount && count === 0 && (
            <span
              style={{
                color: "var(--ink-faint)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
              }}
            >
              empty
            </span>
          )}
          <span
            aria-hidden
            style={{
              color: "var(--prussian)",
              transform: open ? "rotate(90deg)" : "rotate(0)",
              transition: "transform 180ms ease",
              display: "inline-block",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
            }}
          >
            ▸
          </span>
        </div>
      </button>

      {open && (
        <div
          className="px-4 pb-4 pt-2 border-t space-y-4 draw-in"
          style={{ borderColor: "var(--rule-hair)" }}
        >
          {children}
        </div>
      )}
    </section>
  );
}
