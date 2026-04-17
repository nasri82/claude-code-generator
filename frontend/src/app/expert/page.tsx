"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { expertSchema, type ExpertInput } from "@/lib/schemas";
import { preview, generate, type PreviewFile } from "@/lib/api";
import { getCatalog, type HookEvent } from "@/lib/catalog";
import { FileTreePreview } from "@/components/FileTreePreview";
import { StatusBar } from "@/components/StatusBar";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { FieldArray } from "@/components/FieldArray";
import { BootstrapCard } from "@/components/BootstrapCard";
import { PresetPicker } from "@/components/PresetPicker";
import { ReviewPanel } from "@/components/ReviewPanel";
import { ToolsPicker } from "@/components/ToolsPicker";

const DEFAULTS: ExpertInput = {
  project_name: "",
  one_liner: "",
  tech_stack: { language: "", framework: "", database: "", extras: [] },
  architecture: { summary: "", key_directories: {} },
  run_command: "",
  test_command: "",
  build_command: "",
  conventions: [],
  cross_cutting_rules: [],
  commands: [],
  skills: [],
  agents: [],
  hooks: [],
  mcp_servers: [],
  include_memory_md: true,
  allowed_tools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep", "WebFetch"],
  denied_tools: [],
};

export default function ExpertPage() {
  const form = useForm<ExpertInput>({
    resolver: zodResolver(expertSchema),
    defaultValues: DEFAULTS,
  });
  const { register, control, handleSubmit, watch, setValue } = form;
  const allowedTools = watch("allowed_tools") ?? [];
  const deniedTools = watch("denied_tools") ?? [];

  const conv = useFieldArray({ control, name: "conventions" });
  const ccr = useFieldArray({ control, name: "cross_cutting_rules" });
  const cmds = useFieldArray({ control, name: "commands" });
  const skills = useFieldArray({ control, name: "skills" });
  const agents = useFieldArray({ control, name: "agents" });
  const hooks = useFieldArray({ control, name: "hooks" });
  const mcps = useFieldArray({ control, name: "mcp_servers" });

  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hookEvents, setHookEvents] = useState<HookEvent[]>([]);
  const [mcpTransports, setMcpTransports] = useState<string[]>([
    "stdio",
    "sse",
    "http",
  ]);

  useEffect(() => {
    let cancelled = false;
    void getCatalog()
      .then((c) => {
        if (cancelled) return;
        setHookEvents(c.hook_events);
        if (c.mcp_transports?.length) setMcpTransports(c.mcp_transports);
      })
      .catch(() => {
        // Catalog unreachable — existing default states already have sensible
        // hardcoded fallbacks so the form still renders.
        if (!cancelled) {
          setHookEvents([
            { id: "PreToolUse" },
            { id: "PostToolUse" },
            { id: "UserPromptSubmit" },
            { id: "Stop" },
          ]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onPreview(data: ExpertInput) {
    setLoading(true);
    setError(null);
    try {
      const res = await preview("expert", data);
      setFiles(res.files);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onDownload() {
    const data = form.getValues();
    const parsed = expertSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.message);
      return;
    }
    setError(null);
    try {
      await generate("expert", parsed.data);
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

        <header className="mb-8 pb-5 border-b flex items-baseline justify-between gap-6" style={{ borderColor: "var(--rule-hair)" }}>
          <div>
            <div
              className="uppercase mb-2"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                color: "var(--ink-faint)",
                letterSpacing: "0.2em",
              }}
            >
              Tier III · Expert
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", lineHeight: 1, margin: 0, fontVariationSettings: "'SOFT' 30" }}>
              Full agentic scaffold
            </h1>
            <p className="mt-2" style={{ color: "var(--ink-muted)", fontSize: "0.9375rem" }}>
              CLAUDE.md, MEMORY.md, skills, agents, hooks, MCP servers.
            </p>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <PresetPicker<ExpertInput>
              tier="expert"
              getData={() => form.getValues()}
              onLoad={(data) => form.reset(data)}
            />

            <BootstrapCard<ExpertInput>
              tier="expert"
              onFilled={(data) => form.reset(data)}
            />

            <form onSubmit={handleSubmit(onPreview)} className="space-y-4">
              {/* Project basics — always visible */}
              <div className="plate plate-ticked p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label>Project name</label>
                    <input {...register("project_name")} placeholder="vigil-soc" />
                  </div>
                  <div>
                    <label>Run command</label>
                    <input {...register("run_command")} placeholder="uvicorn app.main:app --reload" />
                  </div>
                </div>

                <div>
                  <label>One-liner</label>
                  <input {...register("one_liner")} placeholder="Multi-tenant SOC platform." />
                </div>
              </div>

              <CollapsibleSection
                title="Tech Stack"
                number="§1"
                subtitle="Language, framework, database, commands"
                defaultOpen
              >
                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <label>Test command</label>
                    <input {...register("test_command")} placeholder="pytest" />
                  </div>
                  <div className="col-span-2">
                    <label>Build command</label>
                    <input {...register("build_command")} placeholder="docker compose build" />
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Architecture"
                number="§2"
                subtitle="What lives where"
                defaultOpen
              >
                <div>
                  <label>Summary</label>
                  <textarea
                    rows={3}
                    {...register("architecture.summary")}
                    placeholder="Multi-tenant SaaS with PostgreSQL RLS, event-sourced audit log, Celery for async."
                  />
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                  Key directories can be added after generation by editing CLAUDE.md directly.
                </p>
              </CollapsibleSection>

              <CollapsibleSection
                title="Cross-cutting rules"
                number="§3"
                subtitle="Non-negotiable rules across every module"
                count={ccr.fields.length}
              >
                <FieldArray
                  label="Rules"
                  items={ccr.fields}
                  onAdd={() => ccr.append({ category: "Security", rule: "", rationale: "" })}
                  onRemove={(i) => ccr.remove(i)}
                  renderItem={(i) => (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label>Category</label>
                          <input
                            {...register(`cross_cutting_rules.${i}.category` as const)}
                            placeholder="Security"
                          />
                        </div>
                        <div>
                          <label>Rule</label>
                          <input
                            {...register(`cross_cutting_rules.${i}.rule` as const)}
                            placeholder="Never log secrets"
                          />
                        </div>
                      </div>
                      <div>
                        <label>Rationale</label>
                        <input
                          {...register(`cross_cutting_rules.${i}.rationale` as const)}
                          placeholder="PII risk"
                        />
                      </div>
                    </div>
                  )}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Conventions"
                number="§4"
                count={conv.fields.length}
              >
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

              <CollapsibleSection
                title="Slash commands"
                number="§5"
                count={cmds.fields.length}
              >
                <FieldArray
                  label="Commands"
                  items={cmds.fields}
                  onAdd={() => cmds.append({ name: "review", description: "", body: "" })}
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
                      <div>
                        <label>Body</label>
                        <textarea rows={3} {...register(`commands.${i}.body` as const)} placeholder="Review the staged diff. Focus on bugs, style, missing tests." />
                      </div>
                    </div>
                  )}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Skills"
                number="§6"
                count={skills.fields.length}
              >
                <FieldArray
                  label="Skills"
                  items={skills.fields}
                  onAdd={() => skills.append({ name: "", description: "", body: "" })}
                  onRemove={(i) => skills.remove(i)}
                  renderItem={(i) => (
                    <div className="space-y-2">
                      <div>
                        <label>Name (kebab-case)</label>
                        <input {...register(`skills.${i}.name` as const)} placeholder="soc-triage" />
                      </div>
                      <div>
                        <label>Description (when to invoke — 20+ chars)</label>
                        <textarea rows={2} {...register(`skills.${i}.description` as const)} placeholder="Use when triaging SOC alerts. Walks through severity scoring and escalation logic." />
                      </div>
                      <div>
                        <label>Body</label>
                        <textarea rows={4} {...register(`skills.${i}.body` as const)} placeholder="Step 1: check the alert source..." />
                      </div>
                    </div>
                  )}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Subagents"
                number="§7"
                count={agents.fields.length}
              >
                <FieldArray
                  label="Agents"
                  items={agents.fields}
                  onAdd={() => agents.append({ name: "", description: "", tools: [], model: "", system_prompt: "" })}
                  onRemove={(i) => agents.remove(i)}
                  renderItem={(i) => (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label>Name (kebab-case)</label>
                          <input {...register(`agents.${i}.name` as const)} placeholder="security-reviewer" />
                        </div>
                        <div>
                          <label>When to delegate</label>
                          <input {...register(`agents.${i}.description` as const)} placeholder="Security-focused code review" />
                        </div>
                      </div>
                      <div>
                        <label>Model <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>(optional)</span></label>
                        <input
                          {...register(`agents.${i}.model` as const)}
                          placeholder="sonnet | haiku | opus (leave blank for default)"
                        />
                      </div>
                      <div>
                        <label>System prompt</label>
                        <textarea rows={3} {...register(`agents.${i}.system_prompt` as const)} placeholder="You are a security reviewer. Focus on auth, injection, data leakage..." />
                      </div>
                    </div>
                  )}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Hooks"
                number="§8"
                count={hooks.fields.length}
              >
                <FieldArray
                  label="Hooks"
                  items={hooks.fields}
                  onAdd={() =>
                    hooks.append({
                      event: hookEvents[0]?.id ?? "PreToolUse",
                      matcher: "Bash",
                      command: "",
                    })
                  }
                  onRemove={(i) => hooks.remove(i)}
                  renderItem={(i) => (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label>Event</label>
                          <select {...register(`hooks.${i}.event` as const)}>
                            {hookEvents.map((ev) => (
                              <option
                                key={ev.id}
                                value={ev.id}
                                title={ev.summary}
                              >
                                {ev.id}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label>Matcher</label>
                          <input {...register(`hooks.${i}.matcher` as const)} placeholder="Bash" />
                        </div>
                      </div>
                      <div>
                        <label>Command</label>
                        <input {...register(`hooks.${i}.command` as const)} placeholder="./scripts/pre-bash-guard.sh" />
                      </div>
                    </div>
                  )}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="MCP Servers"
                number="§9"
                count={mcps.fields.length}
              >
                <FieldArray
                  label="Servers"
                  items={mcps.fields}
                  onAdd={() => mcps.append({ name: "", type: "stdio", command: "", args: [], url: "", env: {} })}
                  onRemove={(i) => mcps.remove(i)}
                  renderItem={(i) => (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label>Name</label>
                          <input {...register(`mcp_servers.${i}.name` as const)} placeholder="github" />
                        </div>
                        <div>
                          <label>Type</label>
                          <select {...register(`mcp_servers.${i}.type` as const)}>
                            {mcpTransports.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label>Command (stdio) or URL (http/sse)</label>
                        <input {...register(`mcp_servers.${i}.command` as const)} placeholder="npx" />
                      </div>
                    </div>
                  )}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Tool Permissions"
                number="§10"
                count={allowedTools.length + deniedTools.length}
              >
                <ToolsPicker
                  allowed={allowedTools}
                  denied={deniedTools}
                  onChange={({ allowed, denied }) => {
                    setValue("allowed_tools", allowed, { shouldDirty: true });
                    setValue("denied_tools", denied, { shouldDirty: true });
                  }}
                />
              </CollapsibleSection>

              <CollapsibleSection title="Options" number="§11">
                <label className="flex items-center gap-2 m-0 normal-case tracking-normal" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", fontSize: "0.875rem", textTransform: "none", letterSpacing: 0 }}>
                  <input type="checkbox" {...register("include_memory_md")} className="w-auto" />
                  Include MEMORY.md session-handoff template
                </label>
              </CollapsibleSection>

              <div
                className="sticky bottom-4 mt-6 flex gap-3 items-center p-3 rounded-sm"
                style={{
                  background: "var(--paper-light)",
                  border: "1px solid var(--rule-ink)",
                  boxShadow: "0 -8px 16px -8px rgba(0,0,0,0.06)",
                }}
              >
                <button type="submit" className="btn-ghost">
                  Preview
                </button>
                <button type="button" onClick={onDownload} className="btn-primary">
                  Download ZIP
                </button>
                <span
                  className="ml-auto text-xs"
                  style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
                >
                  {files.length > 0 ? `${files.length} files rendered` : "no preview yet"}
                </span>
              </div>
            </form>

            <ReviewPanel tier="expert" data={watch()} />
          </div>

          <div className="lg:sticky lg:top-6 self-start">
            <FileTreePreview files={files} loading={loading} error={error} />
          </div>
        </div>
      </main>
    </>
  );
}
