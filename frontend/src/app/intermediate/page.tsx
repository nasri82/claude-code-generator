"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { intermediateSchema, type IntermediateInput } from "@/lib/schemas";
import { preview, generate, type PreviewFile } from "@/lib/api";
import { FileTreePreview } from "@/components/FileTreePreview";
import { StatusBar } from "@/components/StatusBar";
import { FieldArray } from "@/components/FieldArray";
import { BootstrapCard } from "@/components/BootstrapCard";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PresetPicker } from "@/components/PresetPicker";
import { ToolsPicker } from "@/components/ToolsPicker";

const DEFAULTS: IntermediateInput = {
  project_name: "",
  one_liner: "",
  tech_stack: { language: "", framework: "", database: "", extras: [] },
  architecture: { summary: "", key_directories: {} },
  run_command: "",
  test_command: "",
  conventions: [],
  commands: [],
  allowed_tools: ["Read", "Edit", "Bash", "Glob", "Grep"],
};

export default function IntermediatePage() {
  const form = useForm<IntermediateInput>({
    resolver: zodResolver(intermediateSchema),
    defaultValues: DEFAULTS,
  });
  const { register, control, handleSubmit, watch, setValue } = form;
  const conv = useFieldArray({ control, name: "conventions" });
  const cmds = useFieldArray({ control, name: "commands" });
  const allowedTools = watch("allowed_tools") ?? [];

  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPreview(data: IntermediateInput) {
    setLoading(true);
    setError(null);
    try {
      const res = await preview("intermediate", data);
      setFiles(res.files);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onDownload() {
    const data = form.getValues();
    const parsed = intermediateSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.message);
      return;
    }
    setError(null);
    try {
      await generate("intermediate", parsed.data);
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
              { label: "I · Beginner",       href: "/beginner",     active: false },
              { label: "II · Intermediate",  href: "/intermediate", active: true  },
              { label: "III · Expert",       href: "/expert",       active: false },
            ].map((t) => (
              <Link
                key={t.href}
                href={t.href}
                style={{
                  fontFamily:     "var(--font-mono)",
                  fontSize:       "0.65rem",
                  letterSpacing:  "0.1em",
                  color:          t.active ? "var(--prussian)" : "var(--ink-faint)",
                  fontWeight:     t.active ? 600 : 400,
                  textDecoration: "none",
                  padding:        "0.2rem 0",
                  borderBottom:   t.active ? "2px solid var(--prussian)" : "2px solid transparent",
                  transition:     "color 0.12s, border-color 0.12s",
                }}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── page header ── */}
        <header className="mb-8">
          <div className="caption mb-2" style={{ letterSpacing: "0.22em" }}>Tier II · Intermediate</div>
          <h1
            style={{
              fontFamily:            "var(--font-display)",
              fontSize:              "clamp(2rem, 4vw, 2.75rem)",
              fontWeight:            500,
              fontVariationSettings: "'SOFT' 30, 'opsz' 72",
              letterSpacing:         "-0.015em",
              lineHeight:            1,
              margin:                0,
              color:                 "var(--ink)",
            }}
          >
            CLAUDE.md with{" "}
            <span
              style={{
                fontVariationSettings: "'SOFT' 80, 'opsz' 72",
                color:                 "var(--prussian)",
              }}
            >
              structure
            </span>
          </h1>
          <p className="mt-2.5" style={{ color: "var(--ink-muted)", fontSize: "0.9375rem", lineHeight: 1.55 }}>
            Architecture, commands, and permissions — all in one place.
          </p>
        </header>

        {/* ── two-col layout ── */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <PresetPicker<IntermediateInput>
              tier="intermediate"
              getData={() => form.getValues()}
              onLoad={(data) => form.reset(data)}
            />

            <BootstrapCard<IntermediateInput>
              tier="intermediate"
              onFilled={(data) => form.reset(data)}
            />

            <form onSubmit={handleSubmit(onPreview)} className="space-y-4">
              {/* Identity plate */}
              <div
                className="plate plate-ticked p-5 space-y-4"
                style={{ background: "var(--paper-light)" }}
              >
                <div
                  className="caption mb-1"
                  style={{ letterSpacing: "0.18em" }}
                >
                  Project identity
                </div>
                <div>
                  <label>Project name</label>
                  <input {...register("project_name")} placeholder="my-api" />
                </div>
                <div>
                  <label>One-liner description</label>
                  <input {...register("one_liner")} placeholder="A REST API for managing todos." />
                </div>
              </div>

              <CollapsibleSection title="Tech Stack" number="§1" defaultOpen>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label>Language</label>
                    <input {...register("tech_stack.language")} placeholder="Python" />
                  </div>
                  <div>
                    <label>Framework</label>
                    <input {...register("tech_stack.framework")} placeholder="FastAPI" />
                  </div>
                  <div className="col-span-2">
                    <label>Database</label>
                    <input {...register("tech_stack.database")} placeholder="PostgreSQL" />
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Architecture" number="§2" defaultOpen>
                <div>
                  <label>Summary</label>
                  <textarea
                    rows={3}
                    {...register("architecture.summary")}
                    placeholder="Describe the high-level structure..."
                  />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Commands" number="§3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label>Run</label>
                    <input {...register("run_command")} placeholder="uvicorn app.main:app --reload" />
                  </div>
                  <div>
                    <label>Test</label>
                    <input {...register("test_command")} placeholder="pytest" />
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Conventions" number="§4" count={conv.fields.length}>
                <FieldArray
                  label="Rules"
                  items={conv.fields}
                  onAdd={() => conv.append({ rule: "", rationale: "" })}
                  onRemove={(i) => conv.remove(i)}
                  renderItem={(i) => (
                    <div className="space-y-2">
                      <input
                        {...register(`conventions.${i}.rule` as const)}
                        placeholder="Rule"
                      />
                      <input
                        {...register(`conventions.${i}.rationale` as const)}
                        placeholder="Rationale (optional)"
                      />
                    </div>
                  )}
                />
              </CollapsibleSection>

              <CollapsibleSection title="Slash Commands" number="§5" count={cmds.fields.length}>
                <FieldArray
                  label="Commands"
                  items={cmds.fields}
                  onAdd={() => cmds.append({ name: "", description: "", body: "" })}
                  onRemove={(i) => cmds.remove(i)}
                  renderItem={(i) => (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label>Name (no slash)</label>
                          <input
                            {...register(`commands.${i}.name` as const)}
                            placeholder="review"
                          />
                        </div>
                        <div>
                          <label>Description</label>
                          <input
                            {...register(`commands.${i}.description` as const)}
                            placeholder="Review the staged diff"
                          />
                        </div>
                      </div>
                      <textarea
                        rows={2}
                        {...register(`commands.${i}.body` as const)}
                        placeholder="Prompt body..."
                      />
                    </div>
                  )}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Allowed Tools"
                number="§6"
                count={allowedTools.length}
              >
                <ToolsPicker
                  allowed={allowedTools}
                  denied={[]}
                  showDeny={false}
                  onChange={({ allowed }) =>
                    setValue("allowed_tools", allowed, { shouldDirty: true })
                  }
                />
              </CollapsibleSection>

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
                  <button type="submit" className="btn-ghost">Preview</button>
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

          <div className="lg:sticky lg:top-6 self-start">
            <FileTreePreview files={files} loading={loading} error={error} />
          </div>
        </div>
      </main>
    </>
  );
}
