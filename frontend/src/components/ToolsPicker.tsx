"use client";

import { useEffect, useState } from "react";
import { getCatalog } from "@/lib/catalog";

interface ToolsPickerProps {
  allowed: string[];
  denied: string[];
  onChange: (next: { allowed: string[]; denied: string[] }) => void;
  /** Show the "denied" column. Intermediate tier only has allow. */
  showDeny?: boolean;
}

type ToolState = "allow" | "deny" | "neutral";

function stateOf(
  tool: string,
  allowed: string[],
  denied: string[],
): ToolState {
  if (allowed.includes(tool)) return "allow";
  if (denied.includes(tool)) return "deny";
  return "neutral";
}

export function ToolsPicker({
  allowed,
  denied,
  onChange,
  showDeny = true,
}: ToolsPickerProps) {
  const [tools, setTools] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getCatalog()
      .then((c) => {
        if (!cancelled) setTools(c.built_in_tools);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Show any user-added tools that aren't in the catalog so they're not lost
  const catalogSet = new Set(tools ?? []);
  const extras = [...allowed, ...denied].filter((t) => !catalogSet.has(t));
  const orderedTools = tools
    ? [...tools, ...Array.from(new Set(extras))]
    : null;

  function applyChange(tool: string, next: ToolState) {
    const a = new Set(allowed);
    const d = new Set(denied);
    a.delete(tool);
    d.delete(tool);
    if (next === "allow") a.add(tool);
    if (next === "deny") d.add(tool);
    onChange({ allowed: Array.from(a), denied: Array.from(d) });
  }

  if (error) {
    return (
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          color: "var(--err)",
        }}
      >
        Could not load tool catalog: {error}
      </p>
    );
  }

  if (!orderedTools) {
    return (
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          color: "var(--ink-muted)",
        }}
      >
        loading tools…
      </p>
    );
  }

  return (
    <div>
      <div
        className="grid gap-x-4 gap-y-1 items-baseline"
        style={{
          gridTemplateColumns: showDeny
            ? "1fr auto auto"
            : "1fr auto",
        }}
      >
        <div
          className="uppercase pb-1 border-b"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.15em",
            color: "var(--ink-faint)",
            borderColor: "var(--rule-hair)",
          }}
        >
          tool
        </div>
        <div
          className="uppercase pb-1 border-b text-center"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.15em",
            color: "var(--prussian)",
            borderColor: "var(--rule-hair)",
          }}
        >
          allow
        </div>
        {showDeny && (
          <div
            className="uppercase pb-1 border-b text-center"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              letterSpacing: "0.15em",
              color: "var(--err)",
              borderColor: "var(--rule-hair)",
            }}
          >
            deny
          </div>
        )}

        {orderedTools.map((tool) => {
          const s = stateOf(tool, allowed, denied);
          const isExtra = !catalogSet.has(tool);
          return (
            <ToolRow
              key={tool}
              tool={tool}
              isExtra={isExtra}
              state={s}
              showDeny={showDeny}
              onAllow={() =>
                applyChange(tool, s === "allow" ? "neutral" : "allow")
              }
              onDeny={() =>
                applyChange(tool, s === "deny" ? "neutral" : "deny")
              }
            />
          );
        })}
      </div>

      <p
        className="mt-3"
        style={{
          fontSize: "0.7rem",
          color: "var(--ink-muted)",
          lineHeight: 1.5,
        }}
      >
        Unchecked = Claude Code default (usually allowed with confirmation).
        {showDeny && " Deny takes precedence over allow."}
      </p>
    </div>
  );
}

interface ToolRowProps {
  tool: string;
  isExtra: boolean;
  state: ToolState;
  showDeny: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

function ToolRow({
  tool,
  isExtra,
  state,
  showDeny,
  onAllow,
  onDeny,
}: ToolRowProps) {
  return (
    <>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.8rem",
          color: isExtra ? "var(--ink-muted)" : "var(--ink)",
        }}
        title={isExtra ? "Custom tool (not in catalog)" : undefined}
      >
        {tool}
        {isExtra && (
          <span
            className="ml-1"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.55rem",
              color: "var(--ink-faint)",
            }}
          >
            (custom)
          </span>
        )}
      </div>
      <div className="text-center">
        <input
          type="checkbox"
          checked={state === "allow"}
          onChange={onAllow}
          aria-label={`Allow ${tool}`}
          className="w-auto"
        />
      </div>
      {showDeny && (
        <div className="text-center">
          <input
            type="checkbox"
            checked={state === "deny"}
            onChange={onDeny}
            aria-label={`Deny ${tool}`}
            className="w-auto"
          />
        </div>
      )}
    </>
  );
}
