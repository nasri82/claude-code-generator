import Link from "next/link";
import { StatusBar } from "@/components/StatusBar";

const tiers = [
  {
    slug: "beginner",
    plate: "I",
    name: "Beginner",
    tagline: "A clean CLAUDE.md and nothing you don't need.",
    output: ["CLAUDE.md"],
    fields: "Project name · one-liner · tech stack · run command · a few conventions",
    time: "2 min",
  },
  {
    slug: "intermediate",
    plate: "II",
    name: "Intermediate",
    tagline: "Structured CLAUDE.md with architecture, commands, permissions.",
    output: ["CLAUDE.md", ".claude/settings.json", ".claude/commands/*.md"],
    fields: "Above + architecture summary · test command · slash commands",
    time: "5 min",
  },
  {
    slug: "expert",
    plate: "III",
    name: "Expert",
    tagline: "Full agentic scaffold. Skills, agents, hooks, MCP, MEMORY.md.",
    output: [
      "CLAUDE.md",
      "MEMORY.md",
      ".claude/settings.json",
      ".mcp.json",
      ".claude/skills/*/SKILL.md",
      ".claude/agents/*.md",
    ],
    fields:
      "Above + cross-cutting rules · skills · subagents · hooks · MCP servers",
    time: "15 min",
  },
];

export default function Home() {
  return (
    <>
      <StatusBar />

      <main className="min-h-screen px-6 py-12 max-w-7xl mx-auto">
        {/* Title plate — like the title block of an architectural drawing */}
        <header
          className="plate plate-ticked p-8 mb-12 draw-in"
          style={{ background: "var(--paper-light)" }}
        >
          <div className="flex items-start justify-between gap-8">
            <div className="min-w-0">
              <div
                className="uppercase mb-3"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  color: "var(--ink-faint)",
                  letterSpacing: "0.25em",
                }}
              >
                Sheet 1 of 1 · Blueprints for Claude Code
              </div>
              <h1
                style={{
                  fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                  lineHeight: 0.95,
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontVariationSettings: "'SOFT' 30, 'opsz' 144",
                  color: "var(--ink)",
                  letterSpacing: "-0.02em",
                }}
              >
                Claude
                <br />
                <span style={{ color: "var(--prussian)" }}>Scaffolder</span>
              </h1>
              <p
                className="mt-4 max-w-xl"
                style={{
                  color: "var(--ink-muted)",
                  fontSize: "1.0625rem",
                  lineHeight: 1.55,
                }}
              >
                Generate{" "}
                <code>CLAUDE.md</code>, skills, commands, agents, hooks, and MCP
                configurations. Draw up your project once, keep the plates on file.
              </p>
            </div>

            {/* Measurement / scale marks on the right of the title block */}
            <div
              className="hidden md:block shrink-0 text-right"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                color: "var(--ink-faint)",
                letterSpacing: "0.1em",
              }}
            >
              <div>REV · 0.2</div>
              <div>SCALE · 1:1</div>
              <div>DRAWN BY · you</div>
            </div>
          </div>
        </header>

        {/* Tiers — three plates */}
        <div
          className="grid gap-6 md:grid-cols-3 stagger"
          style={{ position: "relative" }}
        >
          {tiers.map((tier) => (
            <Link
              key={tier.slug}
              href={`/${tier.slug}`}
              className="plate plate-ticked block p-6 group"
              style={{ background: "var(--paper-light)" }}
            >
              <div
                className="flex items-baseline justify-between mb-4 pb-3 border-b"
                style={{ borderColor: "var(--rule-hair)" }}
              >
                <div className="flex items-baseline gap-3">
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.7rem",
                      color: "var(--ink-faint)",
                      letterSpacing: "0.15em",
                    }}
                  >
                    TIER {tier.plate}
                  </span>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.75rem",
                      fontWeight: 500,
                      margin: 0,
                    }}
                  >
                    {tier.name}
                  </h2>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.7rem",
                    color: "var(--ochre-bold)",
                  }}
                >
                  ~{tier.time}
                </span>
              </div>

              <p
                className="mb-5"
                style={{
                  color: "var(--ink-muted)",
                  fontSize: "0.9375rem",
                  lineHeight: 1.5,
                }}
              >
                {tier.tagline}
              </p>

              <div className="mb-4">
                <div
                  className="uppercase mb-2"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.65rem",
                    color: "var(--ink-faint)",
                    letterSpacing: "0.15em",
                  }}
                >
                  Generates
                </div>
                <ul className="space-y-1">
                  {tier.output.map((f) => (
                    <li
                      key={f}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        color: "var(--ink)",
                      }}
                    >
                      <span style={{ color: "var(--prussian-soft)" }}>›</span> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div
                  className="uppercase mb-1.5"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.65rem",
                    color: "var(--ink-faint)",
                    letterSpacing: "0.15em",
                  }}
                >
                  You provide
                </div>
                <p
                  style={{ color: "var(--ink-muted)", fontSize: "0.8125rem", lineHeight: 1.45 }}
                >
                  {tier.fields}
                </p>
              </div>

              <div
                className="mt-5 pt-3 border-t flex items-center justify-between text-xs"
                style={{ borderColor: "var(--rule-hair)" }}
              >
                <span style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
                  /{tier.slug}
                </span>
                <span
                  className="transition-transform group-hover:translate-x-1"
                  style={{ color: "var(--prussian)" }}
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Legend / learning call-out */}
        <Link
          href="/legend"
          className="plate plate-ticked block mt-6 p-5 group"
          style={{
            background: "var(--paper)",
            borderColor: "var(--rule-ink)",
          }}
        >
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-baseline gap-4 min-w-0">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  color: "var(--ochre-bold)",
                  letterSpacing: "0.2em",
                }}
              >
                SHEET L
              </span>
              <div className="min-w-0">
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.4rem",
                    fontWeight: 500,
                    margin: 0,
                    lineHeight: 1.15,
                  }}
                >
                  New to Claude Code?
                  <span style={{ color: "var(--prussian)" }}> Read the Legend.</span>
                </h2>
                <p
                  className="mt-1.5"
                  style={{
                    color: "var(--ink-muted)",
                    fontSize: "0.875rem",
                    lineHeight: 1.5,
                  }}
                >
                  What every file in the scaffold is for, when to reach for it, and
                  the common ways each one gets misused.
                </p>
              </div>
            </div>
            <span
              className="transition-transform group-hover:translate-x-1 shrink-0"
              style={{ color: "var(--prussian)", fontSize: "1.25rem" }}
            >
              →
            </span>
          </div>
        </Link>

        <footer
          className="mt-16 pt-6 border-t text-xs flex items-center justify-between"
          style={{
            borderColor: "var(--rule-hair)",
            fontFamily: "var(--font-mono)",
            color: "var(--ink-faint)",
            letterSpacing: "0.08em",
          }}
        >
          <span>
            BACKEND · <code>localhost:8000</code> &nbsp;·&nbsp; FRONTEND ·{" "}
            <code>localhost:3000</code>
          </span>
          <span>
            <Link href="/legend" className="link-ruled">
              Legend →
            </Link>
            <span style={{ margin: "0 0.75rem", color: "var(--ink-faint)" }}>·</span>
            <Link href="/settings" className="link-ruled">
              LLM settings →
            </Link>
          </span>
        </footer>
      </main>
    </>
  );
}
