"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  deletePreset,
  getPreset,
  listPresets,
  savePreset,
  type PresetSummary,
} from "@/lib/presets";
import type { Tier } from "@/lib/api";

interface PresetPickerProps<TData> {
  tier: Tier;
  /** Returns the current form values to snapshot on save. */
  getData: () => TData;
  /** Called when a preset is loaded; use it to populate the form. */
  onLoad: (data: TData) => void;
}

function formatWhen(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  const delta = Date.now() - d.getTime();
  const mins = Math.floor(delta / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

function suggestDefaultName(data: unknown): string {
  if (
    data &&
    typeof data === "object" &&
    "project_name" in data &&
    typeof (data as { project_name: unknown }).project_name === "string"
  ) {
    return (data as { project_name: string }).project_name.trim();
  }
  return "";
}

export function PresetPicker<TData>({
  tier,
  getData,
  onLoad,
}: PresetPickerProps<TData>) {
  const [presets, setPresets] = useState<PresetSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  // Save-flow state: null = inactive, string = the typed name
  const [saveName, setSaveName] = useState<string | null>(null);

  // Delete-confirmation state: which preset id is "armed" for confirm?
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Track the last preset we loaded so we can show an "active" indicator
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const saveInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await listPresets(tier);
      setPresets(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [tier]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Close dropdown / save form on outside click
  useEffect(() => {
    if (!open && saveName === null) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSaveName(null);
        setConfirmDelete(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, saveName]);

  // Esc to close everything
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSaveName(null);
        setConfirmDelete(null);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Auto-focus save input when it appears
  useEffect(() => {
    if (saveName !== null) saveInputRef.current?.focus();
  }, [saveName]);

  // Auto-dismiss flash message
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 2500);
    return () => clearTimeout(t);
  }, [flash]);

  function beginSave() {
    setOpen(false);
    setSaveName(suggestDefaultName(getData()));
  }

  async function commitSave() {
    const name = (saveName ?? "").trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await savePreset(
        name,
        tier,
        getData() as Record<string, unknown>,
      );
      await refresh();
      setActivePresetId(saved.id);
      setFlash(`Saved as "${name}"`);
      setSaveName(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onPick(preset: PresetSummary) {
    setBusy(true);
    setError(null);
    try {
      const full = await getPreset(preset.id);
      onLoad(full.data as TData);
      setActivePresetId(preset.id);
      setOpen(false);
      setFlash(`Loaded "${preset.name}"`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function armDelete(preset: PresetSummary, e: React.MouseEvent) {
    e.stopPropagation();
    setConfirmDelete(preset.id);
  }

  async function confirmDeleteNow(preset: PresetSummary, e: React.MouseEvent) {
    e.stopPropagation();
    setBusy(true);
    setError(null);
    try {
      await deletePreset(preset.id);
      if (activePresetId === preset.id) setActivePresetId(null);
      setConfirmDelete(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const count = presets?.length ?? 0;
  const activePreset =
    activePresetId && presets
      ? presets.find((p) => p.id === activePresetId)
      : null;

  return (
    <div
      className="flex items-center gap-2 flex-wrap"
      ref={rootRef}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setSaveName(null);
            setConfirmDelete(null);
          }}
          disabled={busy}
          className="btn-ghost"
          style={{ fontSize: "0.75rem" }}
          title="Load a saved preset for this tier"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          load preset
          {count > 0 && (
            <span
              className="ml-1.5"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--ink-faint)",
                fontSize: "0.65rem",
              }}
            >
              ({count})
            </span>
          )}
          <span className="ml-1" aria-hidden style={{ fontSize: "0.6rem" }}>
            {open ? "▲" : "▼"}
          </span>
        </button>

        {open && (
          <div
            className="absolute z-30 mt-1 rounded-sm"
            style={{
              top: "100%",
              left: 0,
              minWidth: "20rem",
              maxWidth: "26rem",
              background: "var(--paper)",
              border: "1px solid var(--rule-ink)",
              boxShadow: "0 8px 20px -8px rgba(0,0,0,0.2)",
            }}
          >
            {!presets ? (
              <div
                className="px-3 py-3"
                style={{
                  color: "var(--ink-muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                }}
              >
                loading…
              </div>
            ) : presets.length === 0 ? (
              <div
                className="px-3 py-3"
                style={{
                  color: "var(--ink-muted)",
                  fontSize: "0.8rem",
                  lineHeight: 1.5,
                }}
              >
                <div
                  className="uppercase mb-1"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    letterSpacing: "0.2em",
                    color: "var(--ink-faint)",
                  }}
                >
                  no presets yet
                </div>
                Fill the form, then click <em>save preset</em> to reuse this
                setup later.
              </div>
            ) : (
              <ul className="py-1" role="listbox">
                {presets.map((p) => {
                  const isConfirming = confirmDelete === p.id;
                  const isActive = activePresetId === p.id;
                  return (
                    <li
                      key={p.id}
                      className="flex items-baseline gap-2 px-3 py-2"
                      style={{
                        background: isActive
                          ? "rgba(30,58,95,0.05)"
                          : "transparent",
                        borderLeft: isActive
                          ? "2px solid var(--prussian)"
                          : "2px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background =
                            "var(--paper-shadow)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => void onPick(p)}
                        disabled={busy}
                        className="flex-1 min-w-0 text-left"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          color: "var(--ink)",
                        }}
                      >
                        <span className="block truncate">{p.name}</span>
                      </button>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.65rem",
                          color: "var(--ink-faint)",
                          flexShrink: 0,
                        }}
                      >
                        {formatWhen(p.updated_at)}
                      </span>
                      {isConfirming ? (
                        <span className="flex gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => void confirmDeleteNow(p, e)}
                            disabled={busy}
                            style={{
                              background: "transparent",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              color: "var(--err)",
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.7rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                            }}
                          >
                            confirm
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(null);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              color: "var(--ink-muted)",
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.7rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                            }}
                          >
                            cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => armDelete(p, e)}
                          aria-label={`Delete ${p.name}`}
                          title="Delete preset"
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: "0 0.25rem",
                            cursor: "pointer",
                            color: "var(--ink-faint)",
                            fontSize: "1rem",
                            lineHeight: 1,
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--err)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--ink-faint)";
                          }}
                        >
                          ×
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {saveName === null ? (
        <button
          type="button"
          onClick={beginSave}
          disabled={busy}
          className="btn-ghost"
          style={{ fontSize: "0.75rem" }}
          title="Save the current form state as a preset (Esc to cancel)"
        >
          save preset
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void commitSave();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={saveInputRef}
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="preset name"
            maxLength={80}
            className="w-auto"
            style={{
              fontSize: "0.8rem",
              padding: "0.25rem 0.5rem",
              minWidth: "12rem",
            }}
            aria-label="Preset name"
          />
          <button
            type="submit"
            disabled={busy || !saveName.trim()}
            className="btn-ghost"
            style={{ fontSize: "0.75rem" }}
          >
            {busy ? "saving…" : "save"}
          </button>
          <button
            type="button"
            onClick={() => setSaveName(null)}
            disabled={busy}
            className="btn-ghost"
            style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}
          >
            cancel
          </button>
        </form>
      )}

      {activePreset && saveName === null && (
        <span
          className="uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.15em",
            color: "var(--prussian)",
            padding: "0.15em 0.5em",
            border: "1px solid var(--prussian-soft)",
            borderRadius: "2px",
            background: "rgba(30,58,95,0.05)",
          }}
          title="This preset is currently loaded into the form"
        >
          ● {activePreset.name}
        </span>
      )}

      {flash && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--prussian)",
          }}
        >
          {flash}
        </span>
      )}

      {error && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--err)",
          }}
          title={error}
        >
          ! {error.slice(0, 60)}
        </span>
      )}
    </div>
  );
}
