"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConfig, type LLMConfig } from "@/lib/config";
import { aiHealth, type AIHealth } from "@/lib/ai";
import { WhatsNewPanel } from "@/components/WhatsNewPanel";

export function StatusBar() {
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [health, setHealth] = useState<AIHealth | null>(null);
  const [checking, setChecking] = useState(true);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);

  async function refresh() {
    setChecking(true);
    try {
      const [c, h] = await Promise.all([
        getConfig().catch(() => null),
        aiHealth().catch((): AIHealth => ({ ok: false, error: "unreachable" })),
      ]);
      setConfig(c);
      setHealth(h);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    void refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!whatsNewOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setWhatsNewOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [whatsNewOpen]);

  const overrideCount = config ? Object.keys(config.overrides).length : 0;

  return (
    <>
      <div
        className="w-full border-b"
        style={{
          background: "var(--paper-shadow)",
          borderColor: "var(--rule-hair)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-5">
            {/* LLM status lamp */}
            <span className="flex items-center gap-2">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  background: checking
                    ? "var(--ink-faint)"
                    : health?.ok
                      ? "var(--ok)"
                      : "var(--err)",
                  boxShadow: health?.ok
                    ? "0 0 0 3px rgba(90,122,63,0.15)"
                    : "none",
                }}
                aria-hidden
              />
              <span style={{ color: "var(--ink-muted)" }}>
                {checking ? "checking…" : health?.ok ? "LLM online" : "LLM unreachable"}
              </span>
            </span>

            {/* Model */}
            {config?.llm_model && (
              <span className="flex items-center gap-2">
                <span
                  className="uppercase tracking-wider"
                  style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
                >
                  model
                </span>
                <code style={{ fontSize: "0.7rem" }}>{config.llm_model}</code>
              </span>
            )}

            {/* Overrides */}
            {overrideCount > 0 && (
              <span
                className="px-2 py-0.5 rounded-sm"
                style={{
                  background: "var(--ochre-soft)",
                  color: "var(--ochre-bold)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                }}
              >
                {overrideCount} override{overrideCount === 1 ? "" : "s"} active
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setWhatsNewOpen(true)}
              className="link-ruled"
              style={{
                fontSize: "0.75rem",
                background: "transparent",
                border: "none",
                padding: 0,
                color: "var(--prussian)",
                cursor: "pointer",
              }}
              title="Fetch the Claude Code changelog and classify items by relevance"
            >
              ✱ What’s new
            </button>
            <Link href="/legend" className="link-ruled" style={{ fontSize: "0.75rem" }}>
              Legend
            </Link>
            <Link href="/settings" className="link-ruled" style={{ fontSize: "0.75rem" }}>
              ⚙ Settings
            </Link>
          </div>
        </div>
      </div>

      {whatsNewOpen && <WhatsNewPanel onClose={() => setWhatsNewOpen(false)} />}
    </>
  );
}
