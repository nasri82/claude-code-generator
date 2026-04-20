"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { beginnerSchema, type BeginnerInput } from "@/lib/schemas";
import { preview, generate, type PreviewFile } from "@/lib/api";
import { FileTreePreview } from "@/components/FileTreePreview";
import { StatusBar } from "@/components/StatusBar";
import { FieldArray } from "@/components/FieldArray";
import { BootstrapCard } from "@/components/BootstrapCard";
import { PresetPicker } from "@/components/PresetPicker";

const DEFAULTS: BeginnerInput = {
  project_name: "",
  one_liner: "",
  tech_stack: { language: "", framework: "", database: "", extras: [] },
  run_command: "",
  conventions: [],
};

/* ── section wrapper ──────────────────────────────────────────────────────── */

function Section({
  label,
  number,
  children,
}: {
  label: string;
  number: string;
  children: React.ReactNode;
}) {
  return (
    <div className="plate plate-ticked p-6" style={{ background: "var(--paper-light)", position: "relative" }}>
      {/* Section number — faint large bg element */}
      <span
        aria-hidden
        style={{
          position:       "absolute",
          right:          "0.75rem",
          top:            "0.25rem",
          fontFamily:     "var(--font-mono)",
          fontSize:       "3.5rem",
          fontWeight:     400,
          color:          "var(--paper-shadow)",
          lineHeight:     1,
          userSelect:     "none",
          pointerEvents:  "none",
          letterSpacing:  "-0.04em",
        }}
      >
        {number}
      </span>
      <div
        className="caption mb-4"
        style={{ letterSpacing: "0.18em", position: "relative", zIndex: 1 }}
      >
        {label}
      </div>
      <div className="space-y-4" style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

export default function BeginnerPage() {
  const form = useForm<BeginnerInput>({
    resolver: zodResolver(beginnerSchema),
    defaultValues: DEFAULTS,
  });
  const { register, control, handleSubmit } = form;
  const conv = useFieldArray({ control, name: "conventions" });

  const [files, setFiles]     = useState<PreviewFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function onPreview(data: BeginnerInput) {
    setLoading(true);
    setError(null);
    try {
      const res = await preview("beginner", data);
      setFiles(res.files);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onDownload() {
    const data = form.getValues();
    const parsed = beginnerSchema.safeParse(data);
    if (!parsed.success) { setError(parsed.error.message); return; }
    setError(null);
    try {
      await generate("beginner", parsed.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <StatusBar />

      <main className="min-h-screen px-6 py-8 max-w-7xl mx-auto">

        {/* ── breadcrumb + tier strip ── */}
        <div
          className="flex items-center justify-between mb-7 pb-4 border-b"
          style={{ borderColor: "var(--rule-hair)" }}
        >
          <Link
            href="/"
            className="link-ruled"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}
          >
            ← All tiers
          </Link>
          <div className="flex items-center gap-3">
            {[
              { label: "I · Beginner",       href: "/beginner",     active: true },
              { label: "II · Intermediate",  href: "/intermediate", active: false },
              { label: "III · Expert",       href: "/expert",       active: false },
            ].map((t) => (
              <Link
                key={t.href}
                href={t.href}
                style={{
                  fontFamily:    "var(--font-mono)",
                  fontSize:      "0.65rem",
                  letterSpacing: "0.1em",
                  color:         t.active ? "var(--prussian)" : "var(--ink-faint)",
                  fontWeight:    t.active ? 600 : 400,
                  textDecoration: "none",
                  padding:       "0.2rem 0",
                  borderBottom:  t.active ? "2px solid var(--prussian)" : "2px solid transparent",
                  transition:    "color 0.12s, border-color 0.12s",
                }}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── page header ── */}
        <header className="mb-8">
          <div className="caption mb-2" style={{ letterSpacing: "0.22em" }}>Tier I · Beginner</div>
          <h1
            style={{
              fontFamily:          "var(--font-display)",
              fontSize:            "clamp(2rem, 4vw, 2.75rem)",
              fontWeight:          500,
              fontVariationSettings: "'SOFT' 40, 'opsz' 72",
              letterSpacing:       "-0.015em",
              lineHeight:          1,
              margin:              0,
              color:               "var(--ink)",
            }}
          >
            One clean{" "}
            <code
              style={{
                fontFamily:   "var(--font-mono)",
                fontSize:     "0.8em",
                background:   "rgba(30,58,95,0.08)",
                border:       "1px solid rgba(30,58,95,0.15)",
                borderRadius: "3px",
                padding:      "0.05em 0.3em",
                color:        "var(--prussian)",
              }}
            >
              CLAUDE.md
            </code>
          </h1>
          <p className="mt-2.5" style={{ color: "var(--ink-muted)", fontSize: "0.9375rem", lineHeight: 1.55 }}>
            Fill in the details below, preview your output, then download.
          </p>
        </header>

        {/* ── two-col layout: form + preview ── */}
        <div className="grid lg:grid-cols-2 gap-8">

          {/* ── form column ── */}
          <div className="space-y-5">

            <PresetPicker<BeginnerInput>
              tier="beginner"
              getData={() => form.getValues()}
              onLoad={(data) => form.reset(data)}
            />

            <BootstrapCard<BeginnerInput>
              tier="beginner"
              onFilled={(data) => form.reset(data)}
            />

            <form onSubmit={handleSubmit(onPreview)} className="space-y-5">

              {/* §01 Identity */}
              <Section label="Project identity" number="01">
                <div>
                  <label>Project name</label>
                  <input
                    {...register("project_name")}
                    placeholder="my-awesome-app"
                  />
                </div>
                <div>
                  <label>One-liner description</label>
                  <input
                    {...register("one_liner")}
                    placeholder="A REST API for managing todos."
                  />
                </div>
              </Section>

              {/* §02 Stack */}
              <Section label="Tech stack" number="02">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Language</label>
                    <input {...register("tech_stack.language")} placeholder="Python" />
                  </div>
                  <div>
                    <label>Framework</label>
                    <input {...register("tech_stack.framework")} placeholder="FastAPI" />
                  </div>
                </div>
                <div>
                  <label>Database</label>
                  <input {...register("tech_stack.database")} placeholder="PostgreSQL" />
                </div>
              </Section>

              {/* §03 Commands */}
              <Section label="Commands" number="03">
                <div>
                  <label>Run command</label>
                  <input
                    {...register("run_command")}
                    placeholder="uvicorn app.main:app --reload"
                  />
                </div>
              </Section>

              {/* §04 Conventions */}
              <Section label="Conventions" number="04">
                <FieldArray
                  label=""
                  items={conv.fields}
                  onAdd={() => conv.append({ rule: "", rationale: "" })}
                  onRemove={(i) => conv.remove(i)}
                  renderItem={(i) => (
                    <div className="space-y-2">
                      <div>
                        <label>Rule</label>
                        <input
                          {...register(`conventions.${i}.rule` as const)}
                          placeholder="Use type hints everywhere"
                        />
                      </div>
                      <div>
                        <label>Rationale</label>
                        <input
                          {...register(`conventions.${i}.rationale` as const)}
                          placeholder="Enables static analysis"
                        />
                      </div>
                    </div>
                  )}
                />
              </Section>

              {/* ── sticky action bar ── */}
              <div
                className="sticky bottom-4 z-10 flex gap-3 items-center justify-between p-3"
                style={{
                  background:   "var(--paper-light)",
                  border:       "1px solid var(--rule-ink)",
                  borderRadius: "2px",
                  boxShadow:    "0 4px 16px -4px rgba(30,58,95,0.15)",
                }}
              >
                <div className="flex gap-3">
                  <button type="submit" className="btn-ghost">
                    Preview
                  </button>
                  <button type="button" onClick={onDownload} className="btn-primary">
                    Download ZIP
                  </button>
                </div>
                {files.length > 0 && (
                  <span
                    style={{
                      fontFamily:    "var(--font-mono)",
                      fontSize:      "0.65rem",
                      color:         "var(--ok)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    ✓ {files.length} file{files.length !== 1 ? "s" : ""} ready
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* ── preview column ── */}
          <div className="lg:sticky lg:top-6 self-start">
            <FileTreePreview files={files} loading={loading} error={error} />
          </div>
        </div>
      </main>
    </>
  );
}
