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
            Tier II · Intermediate
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", lineHeight: 1, margin: 0 }}>
            CLAUDE.md with structure
          </h1>
          <p className="mt-2" style={{ color: "var(--ink-muted)", fontSize: "0.9375rem" }}>
            Architecture, commands, and permissions.
          </p>
        </header>

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
              <div className="plate plate-ticked p-5 space-y-4">
                <div>
                  <label>Project name</label>
                  <input {...register("project_name")} />
                </div>
                <div>
                  <label>One-liner</label>
                  <input {...register("one_liner")} />
                </div>
              </div>

              <CollapsibleSection title="Tech Stack" number="§1" defaultOpen>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label>Language</label>
                    <input {...register("tech_stack.language")} />
                  </div>
                  <div>
                    <label>Framework</label>
                    <input {...register("tech_stack.framework")} />
                  </div>
                  <div>
                    <label>Database</label>
                    <input {...register("tech_stack.database")} />
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Architecture" number="§2" defaultOpen>
                <div>
                  <label>Summary</label>
                  <textarea rows={3} {...register("architecture.summary")} />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Commands" number="§3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label>Run</label>
                    <input {...register("run_command")} />
                  </div>
                  <div>
                    <label>Test</label>
                    <input {...register("test_command")} />
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
                      <input {...register(`conventions.${i}.rule` as const)} placeholder="Rule" />
                      <input {...register(`conventions.${i}.rationale` as const)} placeholder="Rationale (optional)" />
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
                          <input {...register(`commands.${i}.name` as const)} placeholder="review" />
                        </div>
                        <div>
                          <label>Description</label>
                          <input {...register(`commands.${i}.description` as const)} placeholder="Review the staged diff" />
                        </div>
                      </div>
                      <textarea rows={2} {...register(`commands.${i}.body` as const)} placeholder="Prompt body..." />
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
