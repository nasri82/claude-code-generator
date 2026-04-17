import Link from "next/link";
import { StatusBar } from "@/components/StatusBar";

/* ---------------------------------------------------------------------------
   Content. Each entry is one file or folder Claude Code recognizes.
   Kept as data so the JSX below stays focused on layout.
   --------------------------------------------------------------------------- */

type Entry = {
  id: string;
  number: string;
  file: string;
  kind: "standard" | "convention";
  tagline: string;
  when: string[];
  why: string;
  specimen: string;
  specimenLang: "md" | "json" | "sh";
  mistakes?: string[];
};

const ENTRIES: Entry[] = [
  {
    id: "claude-md",
    number: "01",
    file: "CLAUDE.md",
    kind: "standard",
    tagline: "The always-loaded project instruction file.",
    when: [
      "Any time a new developer joining the project would ask “how does this work?”",
      "When you notice yourself repeating the same corrections to Claude",
      "When project conventions aren’t obvious from code alone",
    ],
    why: "Claude doesn’t know your project. It knows what most Python or Next.js projects look like — but not that yours doesn’t. CLAUDE.md is where you write down what Claude would otherwise have to discover through guesswork. It’s loaded at the start of every session, so anything here is background knowledge for the rest of the chat.",
    specimen: `# my-project

One-line description.

## Stack
- Python 3.12, FastAPI, PostgreSQL with pgvector

## Commands
| Task | Command |
|------|---------|
| Run  | uvicorn app.main:app --reload |
| Test | pytest |

## Conventions
- Type hints everywhere — \`mypy --strict\` is in CI
- Repositories own SQL; services never write raw SQL`,
    specimenLang: "md",
    mistakes: [
      "Making it an essay. Claude skims; optimize for skimming.",
      "Including secrets — this file is committed to git.",
      "Forgetting to update it when conventions change. A stale CLAUDE.md is worse than no CLAUDE.md.",
    ],
  },

  {
    id: "settings-json",
    number: "02",
    file: ".claude/settings.json",
    kind: "standard",
    tagline: "Project-scoped Claude Code configuration — permissions, hooks, env.",
    when: [
      "You want to restrict Claude from network access or destructive operations",
      "You want to run a script before or after Claude uses a specific tool",
      "You want the whole team to share the same Claude Code configuration",
    ],
    why: "By default Claude Code has broad tool access. settings.json is how you draw boundaries. It’s also the only place hooks are declared — shell commands that run at workflow events. Commit this to git so teammates share the same rules.",
    specimen: `{
  "permissions": {
    "allow": ["Read", "Edit", "Bash", "Grep"],
    "deny": ["WebFetch"]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {"type": "command", "command": "./scripts/audit-bash.sh"}
        ]
      }
    ]
  }
}`,
    specimenLang: "json",
    mistakes: [
      "Putting secrets in “env”. Use OS env vars or a dotfile loader.",
      "Forgetting this file is shared. What you want Claude restricted from might not match teammates.",
    ],
  },

  {
    id: "commands",
    number: "03",
    file: ".claude/commands/NAME.md",
    kind: "standard",
    tagline: "Reusable prompt templates you invoke with /NAME.",
    when: [
      "You type the same instructions (review, test, ship, audit) repeatedly",
      "A task has a non-obvious procedure worth capturing",
      "You want teammates to share workflows without copy-pasting prompts",
    ],
    why: "Slash commands are how you standardize recurring prompts. `/review` that always looks at the same things, in the same order, produces consistent output regardless of who runs it. The command name is the filename. `$ARGUMENTS` inside the body receives whatever the user typed after the command.",
    specimen: `---
description: Review staged changes for bugs, style, missing tests
---

Read the staged diff. For each change:
1. Note bugs or edge cases missed.
2. Note style or naming inconsistencies with the codebase.
3. Note missing or inadequate test coverage.

Output: a numbered list, specific and terse.`,
    specimenLang: "md",
    mistakes: [
      "Vague bodies like “review this code.” Claude does that by default — commands earn their keep by being specific.",
      "Not using $ARGUMENTS when the command takes input. `/scrape amazon` beats a generic `/scrape`.",
    ],
  },

  {
    id: "skills",
    number: "04",
    file: ".claude/skills/NAME/SKILL.md",
    kind: "standard",
    tagline: "Procedural knowledge Claude auto-loads when its description matches your task.",
    when: [
      "Your project has a recurring task with a specific procedure (onboard a user, add a scraper, triage an alert)",
      "That procedure has gotchas Claude consistently gets wrong without guidance",
      "The trigger — “when to use this” — is something Claude can recognize in how users phrase requests",
    ],
    why: "Skills are invoked by Claude, not by you. Unlike slash commands (you explicitly type `/foo`), skills trigger when Claude sees your request and decides “this applies to what I’m being asked.” The `description` field is the trigger — Claude reads it, pattern-matches against your task, and pulls the full skill body into context if it fits. The description is the single most important thing in a skill.",
    specimen: `---
name: add-scraper
description: Use when the user asks to add support for a new e-commerce site. Walks through creating the scraper module, tests, and registration.
---

# add-scraper

Step 1: Create app/scrapers/<site>.py following BaseScraper.
Step 2: Register in app/scrapers/__init__.py.
Step 3: Add tests in tests/scrapers/test_<site>.py with fixtures.
Step 4: Update the scheduled task in app/tasks/scrape.py.`,
    specimenLang: "md",
    mistakes: [
      "Weak description. “Helps with scrapers” won’t reliably trigger. “Use when the user asks to add or modify an e-commerce scraper” will.",
      "Writing exposition instead of steps. The body should be procedural — numbered steps Claude can follow.",
      "Over-general skills. A single “development helper” skill competes with itself at trigger time.",
    ],
  },

  {
    id: "agents",
    number: "05",
    file: ".claude/agents/NAME.md",
    kind: "standard",
    tagline: "A specialized subagent with its own system prompt and tool restrictions.",
    when: [
      "A subtask requires a different mindset than the main work (security review vs. feature building)",
      "The subtask needs different tool access (one agent reads only, another writes)",
      "The main context would get polluted by the subtask’s reasoning",
    ],
    why: "Isolation. A “security reviewer” agent won’t suddenly decide to implement a fix. Your main Claude stays focused on shipping while the agent focuses on reviewing. Subagents get their own context window, so they don’t chew into the main conversation’s budget either.",
    specimen: `---
name: security-reviewer
description: Delegate code review for auth, injection, and data-exposure issues.
tools: Read, Grep
---

You are a security reviewer. Read changes and flag:
- Authentication or authorization gaps
- Injection surfaces (SQL, template, command)
- Sensitive data in logs, URLs, or response bodies
- Missing input validation

Output: numbered list of concerns with file/line references.
Do NOT propose fixes — only diagnose.`,
    specimenLang: "md",
    mistakes: [
      "Over-splitting. If the main Claude can do it, don’t make an agent.",
      "Under-restricting tools. An audit agent with Edit access isn’t an audit agent.",
      "Long system prompts. If you’re writing three paragraphs, the role isn’t tight enough.",
    ],
  },

  {
    id: "mcp",
    number: "06",
    file: ".mcp.json",
    kind: "standard",
    tagline: "MCP servers at project root — external services Claude Code can access.",
    when: [
      "You want Claude Code to read/write GitHub issues, PRs, or files",
      "You want Claude to query your staging database read-only",
      "You want Claude to reach into Slack, Linear, Notion, or any service with an MCP server",
    ],
    why: "MCP (Model Context Protocol) is how Claude Code reaches outside the codebase. Unlike ad-hoc scripts, MCP servers expose typed tools Claude can invoke with structured arguments, and they’re loaded once at session start. The config lives at the project root, not inside .claude/, because it’s a project-level capability declaration.",
    specimen: `{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "\${GITHUB_TOKEN}"
      }
    }
  }
}`,
    specimenLang: "json",
    mistakes: [
      "Hardcoding tokens. Always reference env vars with ${VAR}.",
      "Adding servers “just in case.” Each server loads at startup and costs context.",
    ],
  },

  {
    id: "hooks",
    number: "07",
    file: "hooks (inside settings.json)",
    kind: "standard",
    tagline: "Shell commands that run at specific points in Claude’s workflow.",
    when: [
      "You need to enforce policy (refuse rm -rf before the tool runs)",
      "You want to log everything Claude does for audit",
      "You want to format, lint, or test automatically after an edit",
    ],
    why: "Hooks give you observability and guardrails without changing Claude’s behavior. Claude keeps doing what it does; hooks decide what happens around that. Events include PreToolUse (can veto), PostToolUse (reacts), UserPromptSubmit (runs before Claude sees your message), and Stop (runs when a turn ends).",
    specimen: `"hooks": {
  "PostToolUse": [
    {
      "matcher": "Edit|Write",
      "hooks": [
        {"type": "command", "command": "prettier --write $CLAUDE_TOOL_RESULT_PATH"}
      ]
    }
  ]
}`,
    specimenLang: "json",
    mistakes: [
      "Slow hooks. Every hook blocks Claude — keep them sub-second.",
      "Hooks that mutate files Claude is reading. Race conditions.",
      "Putting logic in a hook that belongs in CI or pre-commit.",
    ],
  },

  {
    id: "memory",
    number: "08",
    file: "MEMORY.md",
    kind: "convention",
    tagline: "Living document for project state across sessions.",
    when: [
      "Your project has significant decisions that should survive the next session",
      "Work spans many sessions and context keeps getting lost",
      "You want to hand off work to a future self (or a future Claude)",
    ],
    why: "Not a built-in Claude Code feature — this is a pattern this scaffolder recommends. A session starts with whatever’s in CLAUDE.md plus what’s in the current chat. MEMORY.md is the deliberate “between sessions” store. Claude reads it at the start of a session (because CLAUDE.md tells it to) and updates it before ending.",
    specimen: `# MEMORY.md — my-project

> Living document. Read at session start. Update before session end.

## Current State
Working on tenant isolation. RLS policies in place; tests
failing for cross-tenant reads.

## Decisions Log
### 2026-04-16 — RLS over app-level filtering
Chose database-enforced RLS because app-level filters are
one typo away from data leakage.

## Next Steps
1. Fix test_cross_tenant_leak by adjusting fixture setup
2. Add policy for audit_events table`,
    specimenLang: "md",
    mistakes: [
      "Letting it go stale. If it’s not accurate, it’s worse than nothing.",
      "Making it a diary. Focus on decisions and next steps, not activity logs.",
      "Writing for yourself only. A fresh Claude session reads this cold — it needs to stand alone.",
    ],
  },
];

/* ---------------------------------------------------------------------------
   Layout
   --------------------------------------------------------------------------- */

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.85em",
        background: "var(--paper-shadow)",
        border: "1px solid var(--rule-hair)",
        padding: "0.05em 0.3em",
        borderRadius: "2px",
      }}
    >
      {children}
    </code>
  );
}

function EntryPlate({ entry }: { entry: Entry }) {
  return (
    <article id={entry.id} className="plate plate-ticked p-6 lg:p-8 scroll-mt-24">
      {/* Header */}
      <header
        className="flex items-start justify-between gap-4 mb-5 pb-4 border-b"
        style={{ borderColor: "var(--rule-hair)" }}
      >
        <div className="min-w-0">
          <div
            className="uppercase mb-2"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              color: "var(--ink-faint)",
              letterSpacing: "0.2em",
            }}
          >
            §{entry.number}
          </div>
          <h2
            className="break-all"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.375rem",
              fontWeight: 500,
              color: "var(--ink)",
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            {entry.file}
          </h2>
          <p
            className="mt-2"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              color: "var(--ink-muted)",
              fontStyle: "italic",
              lineHeight: 1.4,
            }}
          >
            {entry.tagline}
          </p>
        </div>
        <span
          className="shrink-0 uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.18em",
            padding: "0.25rem 0.5rem",
            borderRadius: "2px",
            background:
              entry.kind === "standard"
                ? "rgba(30,58,95,0.08)"
                : "rgba(192,138,48,0.12)",
            color:
              entry.kind === "standard"
                ? "var(--prussian)"
                : "var(--ochre-bold)",
            border: `1px solid ${
              entry.kind === "standard"
                ? "rgba(30,58,95,0.2)"
                : "rgba(192,138,48,0.3)"
            }`,
          }}
          title={
            entry.kind === "standard"
              ? "Recognized by Claude Code directly."
              : "A pattern this scaffolder recommends, not a Claude Code built-in."
          }
        >
          {entry.kind}
        </span>
      </header>

      {/* WHEN */}
      <section className="mb-5">
        <div
          className="uppercase mb-2"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--ink-faint)",
            letterSpacing: "0.2em",
          }}
        >
          When you write one
        </div>
        <ul className="space-y-1.5">
          {entry.when.map((w, i) => (
            <li
              key={i}
              className="flex gap-2"
              style={{ fontSize: "0.9375rem", lineHeight: 1.5 }}
            >
              <span style={{ color: "var(--ochre-bold)" }}>›</span>
              <span style={{ color: "var(--ink)" }}>{w}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* WHY */}
      <section className="mb-5">
        <div
          className="uppercase mb-2"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--ink-faint)",
            letterSpacing: "0.2em",
          }}
        >
          Why it matters
        </div>
        <p
          style={{
            color: "var(--ink)",
            fontSize: "0.9375rem",
            lineHeight: 1.6,
          }}
        >
          {entry.why}
        </p>
      </section>

      {/* SPECIMEN */}
      <section className="mb-5">
        <div
          className="uppercase mb-2 flex items-baseline justify-between"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--ink-faint)",
            letterSpacing: "0.2em",
          }}
        >
          <span>Specimen</span>
          <span style={{ letterSpacing: "0.05em", fontSize: "0.6rem" }}>
            {entry.specimenLang}
          </span>
        </div>
        <pre
          className="overflow-x-auto"
          style={{
            background: "var(--paper)",
            border: "1px solid var(--rule-hair)",
            padding: "0.9rem 1rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.78rem",
            lineHeight: 1.6,
            color: "var(--ink)",
            borderRadius: "2px",
          }}
        >
          {entry.specimen}
        </pre>
      </section>

      {/* MISTAKES */}
      {entry.mistakes && entry.mistakes.length > 0 && (
        <section>
          <div
            className="uppercase mb-2"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "var(--ink-faint)",
              letterSpacing: "0.2em",
            }}
          >
            Common mistakes
          </div>
          <ul className="space-y-1.5">
            {entry.mistakes.map((m, i) => (
              <li
                key={i}
                className="flex gap-2"
                style={{ fontSize: "0.875rem", lineHeight: 1.5 }}
              >
                <span style={{ color: "var(--err)" }}>•</span>
                <span style={{ color: "var(--ink-muted)" }}>{m}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

export default function LegendPage() {
  return (
    <>
      <StatusBar />

      <main className="min-h-screen px-6 py-10 max-w-7xl mx-auto">
        <nav className="mb-5">
          <Link
            href="/"
            className="link-ruled text-xs"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            ← All tiers
          </Link>
        </nav>

        {/* Title block */}
        <header
          className="plate plate-ticked p-8 mb-10"
          style={{ background: "var(--paper-light)" }}
        >
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div
                className="uppercase mb-2"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  color: "var(--ink-faint)",
                  letterSpacing: "0.25em",
                }}
              >
                Sheet L · Legend
              </div>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem, 4vw, 3.25rem)",
                  lineHeight: 1,
                  fontVariationSettings: "'SOFT' 30, 'opsz' 144",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                What every file
                <br />
                <span style={{ color: "var(--prussian)" }}>
                  in the scaffold is for
                </span>
              </h1>
              <p
                className="mt-4 max-w-2xl"
                style={{
                  color: "var(--ink-muted)",
                  fontSize: "1rem",
                  lineHeight: 1.6,
                }}
              >
                The scaffolder generates eight kinds of file. This page explains what
                each is, when to reach for it, and the common ways they’re
                misused. Read once, scaffold with intent.
              </p>
            </div>
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
              <div>ENTRIES · {ENTRIES.length.toString().padStart(2, "0")}</div>
            </div>
          </div>
        </header>

        {/* Load-order primer */}
        <section
          className="plate p-6 mb-10"
          style={{
            background: "var(--paper)",
            borderColor: "var(--rule-ink)",
          }}
        >
          <div
            className="uppercase mb-3"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "var(--prussian)",
              letterSpacing: "0.2em",
            }}
          >
            Orientation · how Claude Code loads a project
          </div>
          <ol
            className="space-y-2"
            style={{ fontSize: "0.9375rem", color: "var(--ink)" }}
          >
            <li className="flex gap-3">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--ink-faint)",
                  fontSize: "0.85rem",
                }}
              >
                1.
              </span>
              <span>
                Reads <Kbd>CLAUDE.md</Kbd> at the project root. This is your
                introduction to Claude.
              </span>
            </li>
            <li className="flex gap-3">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--ink-faint)",
                  fontSize: "0.85rem",
                }}
              >
                2.
              </span>
              <span>
                Reads <Kbd>.claude/settings.json</Kbd> for tool permissions, hooks,
                and workflow wiring.
              </span>
            </li>
            <li className="flex gap-3">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--ink-faint)",
                  fontSize: "0.85rem",
                }}
              >
                3.
              </span>
              <span>
                Starts any <Kbd>.mcp.json</Kbd> servers and indexes the
                available tools.
              </span>
            </li>
            <li className="flex gap-3">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--ink-faint)",
                  fontSize: "0.85rem",
                }}
              >
                4.
              </span>
              <span>
                Discovers slash commands under <Kbd>.claude/commands/</Kbd> and
                subagents under <Kbd>.claude/agents/</Kbd>.
              </span>
            </li>
            <li className="flex gap-3">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--ink-faint)",
                  fontSize: "0.85rem",
                }}
              >
                5.
              </span>
              <span>
                Keeps skills under <Kbd>.claude/skills/</Kbd> ready — their
                descriptions are indexed, and bodies are loaded on-demand when a
                description matches your request.
              </span>
            </li>
          </ol>
        </section>

        {/* Main grid: TOC + entries */}
        <div className="grid lg:grid-cols-[14rem_1fr] gap-8">
          {/* TOC */}
          <aside className="lg:sticky lg:top-6 self-start">
            <div
              className="uppercase mb-3 pb-2 border-b"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                color: "var(--ink-faint)",
                letterSpacing: "0.2em",
                borderColor: "var(--rule-hair)",
              }}
            >
              Contents
            </div>
            <ul className="space-y-1.5">
              {ENTRIES.map((e) => (
                <li key={e.id}>
                  <a
                    href={`#${e.id}`}
                    className="link-ruled block"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--ink)",
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ color: "var(--ink-faint)" }}>§{e.number}</span>{" "}
                    {e.file.replace(".claude/", "").replace("/NAME", "/").replace("/NAME.md", "/*.md")}
                  </a>
                </li>
              ))}
            </ul>

            <div
              className="mt-6 pt-4 border-t"
              style={{ borderColor: "var(--rule-hair)" }}
            >
              <div
                className="uppercase mb-2"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6rem",
                  color: "var(--ink-faint)",
                  letterSpacing: "0.2em",
                }}
              >
                Legend keys
              </div>
              <div
                className="space-y-2"
                style={{ fontSize: "0.7rem", color: "var(--ink-muted)" }}
              >
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.05rem 0.35rem",
                      background: "rgba(30,58,95,0.08)",
                      color: "var(--prussian)",
                      border: "1px solid rgba(30,58,95,0.2)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.55rem",
                      letterSpacing: "0.18em",
                      borderRadius: "2px",
                      marginRight: "0.4rem",
                    }}
                  >
                    STANDARD
                  </span>
                  Claude Code built-in.
                </div>
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.05rem 0.35rem",
                      background: "rgba(192,138,48,0.12)",
                      color: "var(--ochre-bold)",
                      border: "1px solid rgba(192,138,48,0.3)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.55rem",
                      letterSpacing: "0.18em",
                      borderRadius: "2px",
                      marginRight: "0.4rem",
                    }}
                  >
                    CONVENTION
                  </span>
                  Pattern this scaffolder recommends, not a built-in.
                </div>
              </div>
            </div>
          </aside>

          {/* Entries */}
          <div className="space-y-8">
            {ENTRIES.map((entry) => (
              <EntryPlate key={entry.id} entry={entry} />
            ))}

            {/* Closing footer */}
            <div
              className="plate p-5"
              style={{
                background: "var(--paper)",
                borderColor: "var(--rule-hair)",
              }}
            >
              <div
                className="uppercase mb-2"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  color: "var(--ink-faint)",
                  letterSpacing: "0.2em",
                }}
              >
                Where to go next
              </div>
              <p
                style={{
                  color: "var(--ink)",
                  fontSize: "0.9375rem",
                  lineHeight: 1.6,
                }}
              >
                Pick a{" "}
                <Link href="/" className="link-ruled">
                  tier
                </Link>{" "}
                and start. Beginner gives you just a CLAUDE.md to edit by hand.
                Intermediate adds commands and permissions. Expert scaffolds
                everything on this page at once — you’ll delete what you
                don’t need and keep what fits.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
