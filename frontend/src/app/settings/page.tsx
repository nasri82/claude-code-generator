"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  getConfig,
  updateConfig,
  resetConfig,
  testConfig,
  listModels,
  type LLMConfig,
  type TestResult,
  type ModelListResponse,
} from "@/lib/config";
import { StatusBar } from "@/components/StatusBar";

export default function SettingsPage() {
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [models, setModels] = useState<ModelListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const [form, setForm] = useState({
    llm_base_url: "",
    llm_model: "",
    llm_api_key: "",
    llm_timeout: 120,
    llm_temperature: 0.3,
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, m] = await Promise.all([getConfig(), listModels().catch(() => null)]);
      setConfig(c);
      setForm({
        llm_base_url: c.llm_base_url,
        llm_model: c.llm_model,
        llm_api_key: c.llm_api_key,
        llm_timeout: c.llm_timeout,
        llm_temperature: c.llm_temperature,
      });
      setModels(m);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (typeof payload.llm_api_key === "string" && payload.llm_api_key.includes("•")) {
        delete payload.llm_api_key;
      }
      const updated = await updateConfig(payload);
      setConfig(updated);
      setForm({
        llm_base_url: updated.llm_base_url,
        llm_model: updated.llm_model,
        llm_api_key: updated.llm_api_key,
        llm_timeout: updated.llm_timeout,
        llm_temperature: updated.llm_temperature,
      });
      setDirty(false);
      const m = await listModels().catch(() => null);
      setModels(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function onTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConfig();
      setTestResult(res);
    } catch (e) {
      setTestResult({
        ok: false,
        latency_ms: null,
        model: null,
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setTesting(false);
    }
  }

  async function onReset() {
    setError(null);
    try {
      const reset = await resetConfig();
      setConfig(reset);
      setForm({
        llm_base_url: reset.llm_base_url,
        llm_model: reset.llm_model,
        llm_api_key: reset.llm_api_key,
        llm_timeout: reset.llm_timeout,
        llm_temperature: reset.llm_temperature,
      });
      setDirty(false);
      setTestResult(null);
      const m = await listModels().catch(() => null);
      setModels(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  const hasOverrides = config && Object.keys(config.overrides).length > 0;

  return (
    <>
      <StatusBar />
      <main className="min-h-screen px-6 py-8 max-w-3xl mx-auto">
        <nav className="mb-5">
          <Link href="/" className="link-ruled text-xs" style={{ fontFamily: "var(--font-mono)" }}>
            ← All tiers
          </Link>
        </nav>

        <header className="mb-8 pb-5 border-b" style={{ borderColor: "var(--rule-hair)" }}>
          <div
            className="uppercase mb-2"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "var(--ink-faint)",
              letterSpacing: "0.2em",
            }}
          >
            Settings · LLM endpoint
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", lineHeight: 1, margin: 0 }}>
            Tune the scaffolder
          </h1>
          <p className="mt-2" style={{ color: "var(--ink-muted)", fontSize: "0.9375rem" }}>
            Overrides live in memory. Restart the backend to fall back to <code>.env</code>.
          </p>
        </header>

        {loading ? (
          <div style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>Loading…</div>
        ) : (
          <div className="space-y-5">
            {/* Status strip */}
            <div
              className="plate p-3 text-sm"
              style={{
                borderColor: testResult?.ok
                  ? "var(--ok)"
                  : testResult
                    ? "var(--err)"
                    : "var(--rule-hair)",
                color: testResult?.ok
                  ? "var(--ok)"
                  : testResult
                    ? "var(--err)"
                    : "var(--ink-muted)",
              }}
            >
              {testResult ? (
                <>
                  <span style={{ fontWeight: 500 }}>
                    {testResult.ok ? "● Connected" : "● Unreachable"}
                  </span>{" "}
                  — {testResult.message}
                </>
              ) : (
                "Press Test to check connectivity."
              )}
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

            {hasOverrides && (
              <div
                className="plate p-3"
                style={{
                  borderColor: "var(--ochre)",
                  background: "var(--ochre-soft)",
                  color: "var(--ochre-bold)",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Runtime overrides active: {Object.keys(config!.overrides).join(", ")}. These revert on backend restart.
              </div>
            )}

            {/* Form */}
            <section className="plate plate-ticked p-5 space-y-5">
              <div>
                <label>Base URL</label>
                <input
                  value={form.llm_base_url}
                  onChange={(e) => update("llm_base_url", e.target.value)}
                  placeholder="http://localhost:11434/v1"
                  style={{ fontFamily: "var(--font-mono)" }}
                />
                <p className="mt-1.5" style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                  OpenAI-compatible <code>/v1</code> endpoint. Ollama, LM Studio, vLLM, OpenAI.
                </p>
              </div>

              <div>
                <label>Model</label>
                {models && models.models.length > 0 ? (
                  <select
                    value={form.llm_model}
                    onChange={(e) => update("llm_model", e.target.value)}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {models.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id}
                        {m.current ? " (current)" : ""}
                      </option>
                    ))}
                    {!models.models.some((m) => m.id === form.llm_model) && (
                      <option value={form.llm_model}>{form.llm_model} (not installed)</option>
                    )}
                  </select>
                ) : (
                  <input
                    value={form.llm_model}
                    onChange={(e) => update("llm_model", e.target.value)}
                    placeholder="qwen2.5-coder:14b"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                )}
                {models?.error && (
                  <p className="mt-1.5" style={{ fontSize: "0.75rem", color: "var(--ochre-bold)" }}>
                    Cannot list models: {models.error.slice(0, 120)}
                  </p>
                )}
                {models && !models.error && (
                  <p className="mt-1.5" style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                    {models.models.length} model{models.models.length === 1 ? "" : "s"} at <code>{models.source}</code>
                  </p>
                )}
              </div>

              <div>
                <label>API Key</label>
                <input
                  value={form.llm_api_key}
                  onChange={(e) => update("llm_api_key", e.target.value)}
                  placeholder="ollama"
                  style={{ fontFamily: "var(--font-mono)" }}
                />
                <p className="mt-1.5" style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                  Ollama ignores this. Bullets mean a real key is stored — retype to replace it.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Timeout (seconds)</label>
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={form.llm_timeout}
                    onChange={(e) => update("llm_timeout", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label>Temperature</label>
                  <input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={form.llm_temperature}
                    onChange={(e) => update("llm_temperature", Number(e.target.value))}
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-wrap gap-3">
              <button onClick={onSave} disabled={!dirty || saving} className="btn-primary">
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={onTest} disabled={testing} className="btn-ghost">
                {testing ? "Testing…" : "Test connection"}
              </button>
              <button onClick={onReset} className="btn-ghost ml-auto">
                Reset to .env
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
