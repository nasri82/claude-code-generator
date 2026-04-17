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

export default function BeginnerPage() {
  const form = useForm<BeginnerInput>({
    resolver: zodResolver(beginnerSchema),
    defaultValues: DEFAULTS,
  });
  const { register, control, handleSubmit } = form;
  const conv = useFieldArray({ control, name: "conventions" });

  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!parsed.success) {
      setError(parsed.error.message);
      return;
    }
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
            Tier I · Beginner
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", lineHeight: 1, margin: 0 }}>
            One clean CLAUDE.md
          </h1>
          <p className="mt-2" style={{ color: "var(--ink-muted)", fontSize: "0.9375rem" }}>
            Fill it in, preview, download.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
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
              <div className="plate plate-ticked p-5 space-y-4">
                <div>
                  <label>Project name</label>
                  <input {...register("project_name")} placeholder="my-awesome-app" />
                </div>
                <div>
                  <label>One-liner description</label>
                  <input {...register("one_liner")} placeholder="A REST API for managing todos." />
                </div>
              </div>

              <fieldset className="plate plate-ticked p-5 space-y-3">
                <legend
                  className="px-2 uppercase"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.65rem",
                    color: "var(--ink-faint)",
                    letterSpacing: "0.15em",
                  }}
                >
                  Tech Stack
                </legend>
                <div>
                  <label>Language</label>
                  <input {...register("tech_stack.language")} placeholder="Python" />
                </div>
                <div>
                  <label>Framework</label>
                  <input {...register("tech_stack.framework")} placeholder="FastAPI" />
                </div>
                <div>
                  <label>Database</label>
                  <input {...register("tech_stack.database")} placeholder="PostgreSQL" />
                </div>
              </fieldset>

              <div className="plate plate-ticked p-5">
                <label>Run command</label>
                <input {...register("run_command")} placeholder="uvicorn app.main:app --reload" />
              </div>

              <div className="plate plate-ticked p-5">
                <FieldArray
                  label="Conventions"
                  items={conv.fields}
                  onAdd={() => conv.append({ rule: "", rationale: "" })}
                  onRemove={(i) => conv.remove(i)}
                  renderItem={(i) => (
                    <div className="space-y-2">
                      <div>
                        <label>Rule</label>
                        <input {...register(`conventions.${i}.rule` as const)} placeholder="Use type hints everywhere" />
                      </div>
                      <div>
                        <label>Rationale</label>
                        <input {...register(`conventions.${i}.rationale` as const)} placeholder="Enables static analysis" />
                      </div>
                    </div>
                  )}
                />
              </div>

              <div
                className="sticky bottom-4 flex gap-3 items-center p-3 rounded-sm"
                style={{
                  background: "var(--paper-light)",
                  border: "1px solid var(--rule-ink)",
                }}
              >
                <button type="submit" className="btn-ghost">Preview</button>
                <button type="button" onClick={onDownload} className="btn-primary">Download ZIP</button>
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
