"use client";

import Link from "next/link";
import { StatusBar } from "@/components/StatusBar";
import type { ReactNode } from "react";

/* ── primitives ──────────────────────────────────────────────────────────── */

function Block({ children, hot }: { children: ReactNode; hot?: boolean }) {
  return (
    <div
      className="mb-10 pl-6"
      style={{ borderLeft: `2px solid ${hot ? "var(--prussian)" : "var(--rule-hair)"}` }}
    >
      {children}
    </div>
  );
}

function SectionNum({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.75rem",
        color:         "var(--prussian)",
        marginRight:   "0.65rem",
        verticalAlign: "middle",
        fontWeight:    400,
      }}
    >
      {children}
    </span>
  );
}

function NewBadge() {
  return (
    <span
      style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.6rem",
        letterSpacing: "0.15em",
        background:    "var(--prussian)",
        color:         "var(--paper)",
        padding:       "2px 7px",
        borderRadius:  "2px",
        marginLeft:    "0.6rem",
        verticalAlign: "middle",
        fontWeight:    600,
      }}
    >
      NEW
    </span>
  );
}

function Cmd({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "comment" | "bare" }) {
  const prefix = variant === "comment" ? "#" : variant === "bare" ? "" : "$";
  return (
    <div
      className="my-2 overflow-x-auto"
      style={{
        fontFamily:  "var(--font-mono)",
        fontSize:    "0.8125rem",
        background:  "var(--paper-shadow)",
        border:      "1px solid var(--rule-hair)",
        borderRadius:"2px",
        padding:     "0.7rem 1rem",
        whiteSpace:  "pre",
        color:       "var(--ink)",
        position:    "relative",
      }}
    >
      {prefix && (
        <span style={{ color: "var(--prussian)", marginRight: "0.6rem", userSelect: "none" }}>
          {prefix}
        </span>
      )}
      {children}
    </div>
  );
}

function Pre({ children }: { children: ReactNode }) {
  return (
    <pre
      style={{
        fontFamily:  "var(--font-mono)",
        fontSize:    "0.775rem",
        background:  "var(--paper-shadow)",
        border:      "1px solid var(--rule-hair)",
        borderRadius:"2px",
        padding:     "0.9rem 1rem",
        overflowX:   "auto",
        lineHeight:  1.6,
        margin:      "0.5rem 0 1rem",
        color:       "var(--ink-muted)",
      }}
    >
      {children}
    </pre>
  );
}

function Callout({ children, variant = "info" }: { children: ReactNode; variant?: "info" | "warn" | "good" }) {
  const colors = {
    info: { border: "var(--prussian)", bg: "rgba(30,58,95,0.05)" },
    warn: { border: "var(--err)",      bg: "rgba(156,61,42,0.04)" },
    good: { border: "var(--ok)",       bg: "rgba(90,122,63,0.05)" },
  };
  return (
    <div
      style={{
        borderLeft:  `3px solid ${colors[variant].border}`,
        background:  colors[variant].bg,
        padding:     "0.75rem 1rem",
        margin:      "1rem 0 1.25rem",
        fontSize:    "0.875rem",
      }}
    >
      {children}
    </div>
  );
}

function CalloutLabel({ variant = "info", children }: { variant?: "info" | "warn" | "good"; children: ReactNode }) {
  const color = { info: "var(--prussian)", warn: "var(--err)", good: "var(--ok)" }[variant];
  return (
    <span
      style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.6rem",
        letterSpacing: "0.15em",
        textTransform: "uppercase" as const,
        color,
        marginRight:   "0.5rem",
        fontWeight:    600,
      }}
    >
      {children}
    </span>
  );
}

function TierHeader({
  badge,
  badgeVariant = "default",
  title,
  subtitle,
  italic = true,
}: {
  badge: string;
  badgeVariant?: "t1" | "t2" | "t3" | "default";
  title: string;
  subtitle: string;
  italic?: boolean;
}) {
  const badgeStyle = {
    t1:      { background: "var(--prussian)",   color: "var(--paper)" },
    t2:      { background: "var(--ochre)",       color: "var(--paper-light)" },
    t3:      { background: "var(--ok)",          color: "var(--paper)" },
    default: { background: "var(--paper-shadow)", color: "var(--prussian)", border: "1px solid var(--prussian)" },
  }[badgeVariant];

  return (
    <div
      className="flex items-baseline gap-5 mb-8 pt-7"
      style={{ borderTop: "1px solid var(--rule-ink)" }}
    >
      <span
        style={{
          ...badgeStyle,
          fontFamily:    "var(--font-mono)",
          fontSize:      "0.65rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase" as const,
          padding:       "5px 10px",
          borderRadius:  "2px",
          fontWeight:    600,
          whiteSpace:    "nowrap" as const,
        }}
      >
        {badge}
      </span>
      <h2
        style={{
          fontFamily:            "var(--font-display)",
          fontStyle:             italic ? "italic" : "normal",
          fontWeight:            400,
          fontSize:              "clamp(1.75rem, 3vw, 2.5rem)",
          margin:                0,
          lineHeight:            1,
          color:                 "var(--ink)",
          fontVariationSettings: "'SOFT' 40, 'opsz' 72",
        }}
      >
        {title}
      </h2>
      <span
        className="caption"
        style={{ letterSpacing: "0.15em", marginLeft: "auto" }}
      >
        {subtitle}
      </span>
    </div>
  );
}

/* ── table helper ─────────────────────────────────────────────────────────── */
function T({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table
        style={{
          width:         "100%",
          borderCollapse:"collapse",
          margin:        "0.5rem 0 1.5rem",
          fontSize:      "0.8375rem",
        }}
      >
        {children}
      </table>
    </div>
  );
}

function TH({ children, w }: { children: ReactNode; w?: string }) {
  return (
    <th
      style={{
        textAlign:     "left",
        padding:       "0.5rem 0.875rem",
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.6rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        color:         "var(--ink-faint)",
        fontWeight:    500,
        borderBottom:  "1px solid var(--rule-ink)",
        paddingBottom: "0.4rem",
        width:         w,
      }}
    >
      {children}
    </th>
  );
}

function TD({ children, first }: { children: ReactNode; first?: boolean }) {
  return (
    <td
      style={{
        textAlign:    "left",
        padding:      "0.5rem 0.875rem",
        borderBottom: "1px solid var(--rule-hair)",
        verticalAlign:"top",
        width:        first ? "36%" : undefined,
      }}
    >
      {children}
    </td>
  );
}

function IC({ children }: { children: ReactNode }) {
  return (
    <code
      style={{
        fontFamily:   "var(--font-mono)",
        fontSize:     "0.8em",
        whiteSpace:   "nowrap" as const,
      }}
    >
      {children}
    </code>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

export default function CheatsheetPage() {
  return (
    <>
      <StatusBar />

      <main className="min-h-screen px-6 py-8 max-w-6xl mx-auto">

        {/* breadcrumb */}
        <div
          className="flex items-center justify-between mb-7 pb-4 border-b"
          style={{ borderColor: "var(--rule-hair)" }}
        >
          <Link
            href="/"
            className="link-ruled"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}
          >
            ← Home
          </Link>
          <span className="caption" style={{ letterSpacing: "0.18em" }}>Reference</span>
        </div>

        {/* ── hero ── */}
        <header
          className="mb-10 pb-8 border-b"
          style={{ borderColor: "var(--rule-hair)" }}
        >
          <div className="caption mb-3" style={{ letterSpacing: "0.22em" }}>
            Anthropic · Claude Code
          </div>
          <h1
            style={{
              fontFamily:            "var(--font-display)",
              fontWeight:            400,
              fontSize:              "clamp(2.5rem, 6vw, 4.5rem)",
              lineHeight:            0.95,
              letterSpacing:         "-0.02em",
              margin:                "0 0 1rem",
              fontVariationSettings: "'opsz' 144, 'SOFT' 20",
              color:                 "var(--ink)",
            }}
          >
            The Complete{" "}
            <em
              style={{
                fontStyle:             "italic",
                fontWeight:            300,
                color:                 "var(--prussian)",
                fontVariationSettings: "'SOFT' 80, 'opsz' 144",
              }}
            >
              Cheat Sheet
            </em>
          </h1>
          <p
            style={{
              color:     "var(--ink-muted)",
              fontSize:  "1.0625rem",
              maxWidth:  "560px",
              lineHeight:1.55,
              margin:    "0 0 1.5rem",
            }}
          >
            Every command, flag, shortcut, hook, and workflow — from first install to
            enterprise-grade agent orchestration.
          </p>
          <div
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "0.7rem",
              color:         "var(--ink-faint)",
              lineHeight:    1.9,
              display:       "flex",
              gap:           "2rem",
              flexWrap:      "wrap" as const,
            }}
          >
            <span><span style={{ color: "var(--ink-muted)" }}>revision </span><span style={{ color: "var(--prussian)" }}>apr 2026</span></span>
            <span><span style={{ color: "var(--ink-muted)" }}>model </span><span style={{ color: "var(--prussian)" }}>opus 4.7</span></span>
            <span><span style={{ color: "var(--ink-muted)" }}>version </span><span style={{ color: "var(--prussian)" }}>v2.1.101+</span></span>
            <span><span style={{ color: "var(--ink-muted)" }}>tiers </span><span style={{ color: "var(--prussian)" }}>3</span></span>
          </div>
        </header>

        {/* ── TOC ── */}
        <nav
          className="grid mb-14"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap:                 "1px",
            background:          "var(--rule-hair)",
            border:              "1px solid var(--rule-hair)",
            borderRadius:        "2px",
          }}
        >
          {[
            { id: "#install",     num: "00", label: "Install & Setup" },
            { id: "#beginner",    num: "01", label: "Beginner" },
            { id: "#intermediate",num: "02", label: "Intermediate" },
            { id: "#expert",      num: "03", label: "Expert" },
            { id: "#whats-new",   num: "04", label: "What's New" },
            { id: "#appendix",    num: "05", label: "Appendix" },
          ].map((t) => (
            <a
              key={t.id}
              href={t.id}
              style={{
                display:       "flex",
                flexDirection: "column" as const,
                gap:           "3px",
                padding:       "1rem 1.125rem",
                background:    "var(--paper-light)",
                textDecoration:"none",
                fontFamily:    "var(--font-mono)",
                fontSize:      "0.7rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color:         "var(--ink-muted)",
                transition:    "background 0.12s, color 0.12s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "var(--paper-shadow)";
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--prussian)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "var(--paper-light)";
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink-muted)";
              }}
            >
              <span style={{ fontSize: "0.6rem", color: "var(--ink-faint)" }}>{t.num}</span>
              {t.label}
            </a>
          ))}
        </nav>

        {/* ================================================================ */}
        {/* 00 · INSTALL                                                     */}
        {/* ================================================================ */}
        <section id="install" style={{ scrollMarginTop: "1.5rem", marginBottom: "5rem" }}>
          <TierHeader badge="00" title="Install & Get Started" subtitle="Pick your surface" italic={false} />

          <p className="mb-6" style={{ color: "var(--ink-muted)", fontSize: "0.9375rem", lineHeight: 1.6 }}>
            Claude Code runs across <strong>terminal, VS Code, JetBrains, Desktop app, and the web</strong>. Every surface shares the same engine, so your <code>CLAUDE.md</code>, settings, and MCP servers travel with you.
          </p>

          <div className="grid md:grid-cols-2 gap-5 mb-6">
            {[
              { title: "Terminal — macOS / Linux / WSL", cmd: "curl -fsSL https://claude.ai/install.sh | bash", note: "Auto-updating native install. No Node.js required." },
              { title: "Terminal — Windows PowerShell", cmd: "irm https://claude.ai/install.ps1 | iex", note: <>Requires Git for Windows. For CMD use <code>curl -fsSL https://claude.ai/install.cmd -o install.cmd &amp;&amp; install.cmd</code>.</> },
              { title: "Homebrew", cmd: "brew install --cask claude-code", note: <><code>claude-code</code> tracks stable, <code>claude-code@latest</code> tracks latest. Run <code>brew upgrade</code> to update.</> },
              { title: "WinGet", cmd: "winget install Anthropic.ClaudeCode", note: <>Update with <code>winget upgrade Anthropic.ClaudeCode</code>.</> },
              { title: "VS Code / Cursor", cmd: null, note: <>Search <em>&ldquo;Claude Code&rdquo;</em> in Extensions (<kbd>⌘⇧X</kbd> / <kbd>Ctrl+Shift+X</kbd>), install, then <kbd>⌘⇧P</kbd> → <em>Claude Code: Open in New Tab</em>. Inline diffs, @-mentions, plan review built in.</> },
              { title: "JetBrains IDEs", cmd: null, note: "Install Claude Code from the JetBrains Marketplace. Works with IntelliJ, PyCharm, WebStorm, GoLand, RubyMine, and others." },
              { title: "Desktop App", cmd: null, note: "macOS (Intel + Apple Silicon) and Windows (x64 + ARM64). Visual diff review, multiple parallel sessions, scheduled cloud tasks. Paid subscription required." },
              { title: "Web — claude.ai/code", cmd: null, note: <>Zero setup. Kick off long-running tasks, work on repos you don&apos;t have locally, pull sessions into your terminal later with <code>claude --teleport</code>.</> },
            ].map((card) => (
              <div
                key={card.title}
                className="plate p-5"
                style={{ background: "var(--paper-light)" }}
              >
                <div
                  style={{
                    fontFamily:    "var(--font-mono)",
                    fontSize:      "0.65rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase" as const,
                    color:         "var(--prussian)",
                    marginBottom:  "0.75rem",
                    fontWeight:    600,
                  }}
                >
                  {card.title}
                </div>
                {card.cmd && <Cmd>{card.cmd}</Cmd>}
                <p style={{ color: "var(--ink-muted)", fontSize: "0.8375rem", margin: 0, lineHeight: 1.55 }}>
                  {card.note}
                </p>
              </div>
            ))}
          </div>

          <Callout>
            <CalloutLabel>First run</CalloutLabel>
            <code>cd your-project &amp;&amp; claude</code> — you&apos;ll be prompted to log in. For API-usage billing instead of a subscription, use <code>claude auth login --console</code>.
          </Callout>
        </section>

        {/* ================================================================ */}
        {/* 01 · BEGINNER                                                    */}
        {/* ================================================================ */}
        <section id="beginner" style={{ scrollMarginTop: "1.5rem", marginBottom: "5rem" }}>
          <TierHeader badge="Tier 01" badgeVariant="t1" title="Beginner" subtitle="Your first hour" />

          <p className="mb-8" style={{ color: "var(--ink)", fontSize: "1rem", lineHeight: 1.6 }}>
            Get productive fast. Eight commands, three shortcuts, and one markdown file are enough to start delegating real work.
          </p>

          <Block hot>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>01.1</SectionNum>Starting &amp; ending a session
            </h2>
            <T>
              <thead><tr><TH w="36%">Command</TH><TH>What it does</TH></tr></thead>
              <tbody>
                <tr><TD first><IC>claude</IC></TD><TD>Start an interactive session in the current directory.</TD></tr>
                <tr><TD first><IC>{"claude \"explain this project\""}</IC></TD><TD>Start a session with an initial prompt.</TD></tr>
                <tr><TD first><IC>{`claude -p "explain this function"`}</IC></TD><TD>One-shot query: print the answer and exit (no interactive session).</TD></tr>
                <tr><TD first><IC>claude -c</IC></TD><TD>Continue the most recent conversation in this directory.</TD></tr>
                <tr><TD first><IC>claude -r</IC></TD><TD>Open a picker to resume any past session by ID or name.</TD></tr>
                <tr><TD first><IC>claude update</IC></TD><TD>Update to the latest version (native installs auto-update already).</TD></tr>
                <tr><TD first><IC>claude -v</IC></TD><TD>Print the installed version.</TD></tr>
                <tr><TD first><IC>claude auth login / logout / status</IC></TD><TD>Sign in, sign out, or check auth state. Add <code>--console</code> for API billing.</TD></tr>
              </tbody>
            </T>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>01.2</SectionNum>Essential slash commands
            </h2>
            <p style={{ color: "var(--ink-muted)", marginBottom: "0.75rem", fontSize: "0.9rem" }}>Inside a session, type <code>/</code> to see every command. Start with these:</p>
            <T>
              <thead><tr><TH w="28%">Command</TH><TH>Purpose</TH></tr></thead>
              <tbody>
                <tr><TD first><IC>/help</IC></TD><TD>Show help and all available commands.</TD></tr>
                <tr><TD first><IC>/init</IC></TD><TD>Generate a <code>CLAUDE.md</code> project guide. Set <code>CLAUDE_CODE_NEW_INIT=1</code> for the interactive flow.</TD></tr>
                <tr><TD first><IC>/clear</IC></TD><TD>Wipe conversation + context (aliases: <code>/reset</code>, <code>/new</code>).</TD></tr>
                <tr><TD first><IC>/compact [focus]</IC></TD><TD>Summarize the conversation to free up context. Optional focus hint.</TD></tr>
                <tr><TD first><IC>/model [model]</IC></TD><TD>Switch model mid-session. Takes effect immediately.</TD></tr>
                <tr><TD first><IC>/cost</IC></TD><TD>Show token usage &amp; spend for this session.</TD></tr>
                <tr><TD first><IC>/usage</IC></TD><TD>Plan usage limits and rate-limit status.</TD></tr>
                <tr><TD first><IC>/config</IC></TD><TD>Open settings: theme, model, editor mode, output style. Alias <code>/settings</code>.</TD></tr>
                <tr><TD first><IC>/doctor</IC></TD><TD>Diagnose your install. Press <kbd>f</kbd> to let Claude fix reported issues.</TD></tr>
                <tr><TD first><IC>/exit</IC></TD><TD>Exit the CLI. Alias: <code>/quit</code>.</TD></tr>
                <tr><TD first><IC>/powerup</IC></TD><TD>Interactive tutorial with animated demos of new features.</TD></tr>
              </tbody>
            </T>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.75rem", color: "var(--ink)" }}>
              <SectionNum>01.3</SectionNum>Keyboard shortcuts you&apos;ll use every day
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <T>
                <thead><tr><TH>Shortcut</TH><TH>Action</TH></tr></thead>
                <tbody>
                  <tr><TD><kbd>Ctrl+C</kbd></TD><TD>Cancel input / generation</TD></tr>
                  <tr><TD><kbd>Ctrl+D</kbd></TD><TD>Exit session</TD></tr>
                  <tr><TD><kbd>Ctrl+L</kbd></TD><TD>Clear prompt + redraw screen (history kept)</TD></tr>
                  <tr><TD><kbd>Shift+Tab</kbd></TD><TD>Cycle permission modes</TD></tr>
                  <tr><TD><kbd>Esc</kbd> <kbd>Esc</kbd></TD><TD>Rewind to a previous point in the conversation</TD></tr>
                  <tr><TD><kbd>?</kbd></TD><TD>Show all available shortcuts for your terminal</TD></tr>
                </tbody>
              </T>
              <T>
                <thead><tr><TH>Input</TH><TH>Does this</TH></tr></thead>
                <tbody>
                  <tr><TD><kbd>/</kbd> at start</TD><TD>Slash command / skill</TD></tr>
                  <tr><TD><kbd>!</kbd> at start</TD><TD>Bash mode — run a shell command directly</TD></tr>
                  <tr><TD><kbd>@</kbd></TD><TD>Mention / autocomplete a file path</TD></tr>
                  <tr><TD><kbd>\</kbd>+<kbd>Enter</kbd></TD><TD>Multiline input (works in every terminal)</TD></tr>
                  <tr><TD><kbd>Shift+Enter</kbd></TD><TD>Multiline (iTerm2, WezTerm, Ghostty, Kitty). For others: <code>/terminal-setup</code>.</TD></tr>
                  <tr><TD><kbd>Ctrl+V</kbd></TD><TD>Paste image from clipboard</TD></tr>
                </tbody>
              </T>
            </div>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>01.4</SectionNum>CLAUDE.md — your project&apos;s persistent memory
            </h2>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
              <code>CLAUDE.md</code> sits in your project root and loads at the start of every session. Use it for <strong>coding standards, architecture decisions, preferred libraries, review checklists</strong>, and anything you&apos;d otherwise have to repeat in every prompt.
            </p>
            <Cmd variant="comment">Generate a starter:</Cmd>
            <Cmd>/init</Cmd>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
              Claude also builds <strong>auto memory</strong> as it works — saving build commands, debugging insights, and project quirks across sessions without you writing a thing. View or toggle with <code>/memory</code>.
            </p>
            <Callout variant="good">
              <CalloutLabel variant="good">Tip</CalloutLabel>
              Nested <code>CLAUDE.md</code> files in subdirectories are loaded lazily when Claude accesses those folders. Use them to scope rules per subsystem — e.g. one for <code>/backend</code>, another for <code>/frontend</code>.
            </Callout>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.75rem", color: "var(--ink)" }}>
              <SectionNum>01.5</SectionNum>Your first real tasks
            </h2>
            <Cmd variant="comment">1. Let it explore the codebase for you</Cmd>
            <Cmd>{`claude "give me a tour of this repo — what does it do and how is it structured?"`}</Cmd>
            <Cmd variant="comment">2. Fix a bug</Cmd>
            <Cmd>{`claude "users can't log in — error message is 'invalid token'. find and fix."`}</Cmd>
            <Cmd variant="comment">3. Write tests &amp; verify</Cmd>
            <Cmd>{`claude "write tests for the auth module, run them, and fix any failures"`}</Cmd>
            <Cmd variant="comment">4. Commit your work</Cmd>
            <Cmd>{`claude "commit my changes with a descriptive message"`}</Cmd>
          </Block>
        </section>

        {/* ================================================================ */}
        {/* 02 · INTERMEDIATE                                                */}
        {/* ================================================================ */}
        <section id="intermediate" style={{ scrollMarginTop: "1.5rem", marginBottom: "5rem" }}>
          <TierHeader badge="Tier 02" badgeVariant="t2" title="Intermediate" subtitle="Multi-session workflows & scripting" />

          <p className="mb-8" style={{ color: "var(--ink)", fontSize: "1rem", lineHeight: 1.6 }}>
            Pipe, schedule, parallelize, checkpoint. Once you&apos;re comfortable with the basics, these are the features that change how you actually work.
          </p>

          <Block hot>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>02.1</SectionNum>Models &amp; effort levels
            </h2>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>Claude Code supports the full Claude 4 family. Effort levels trade latency for depth of reasoning.</p>
            <T>
              <thead><tr><TH w="32%">Model</TH><TH>Role</TH></tr></thead>
              <tbody>
                <tr><TD first><IC>claude-opus-4-7</IC></TD><TD>Flagship reasoning + agentic coding. 3× vision resolution. Default for complex work.</TD></tr>
                <tr><TD first><IC>claude-opus-4-6</IC></TD><TD>Previous flagship. 1M context window GA at standard pricing.</TD></tr>
                <tr><TD first><IC>claude-sonnet-4-6</IC></TD><TD>Balanced speed/intelligence. Default on Free + Pro. 1M context.</TD></tr>
                <tr><TD first><IC>claude-haiku-4-5-20251001</IC></TD><TD>Fast + cheap. Great for subagents and high-volume pipelines.</TD></tr>
              </tbody>
            </T>
            <div className="caption mb-3 mt-4" style={{ letterSpacing: "0.1em" }}>Effort levels (Opus 4.7)</div>
            <Cmd>/effort high</Cmd>
            <Cmd>claude --effort xhigh</Cmd>
            <ul style={{ color: "var(--ink-muted)", fontSize: "0.875rem", paddingLeft: "1.125rem", margin: "0.5rem 0 1rem" }}>
              <li style={{ marginBottom: "0.35rem" }}><code>low / medium / high</code> — persist across sessions</li>
              <li style={{ marginBottom: "0.35rem" }}><code>xhigh</code> — new in Opus 4.7, sits between <code>high</code> and <code>max</code></li>
              <li style={{ marginBottom: "0.35rem" }}><code>max</code> — current session only, Opus 4.6+ required</li>
              <li style={{ marginBottom: "0.35rem" }}><code>auto</code> — reset to the model&apos;s default</li>
            </ul>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>Runtime shortcut: <kbd>Option+P</kbd> (macOS) or <kbd>Alt+P</kbd> (Win/Linux) to switch model without clearing your prompt.</p>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>02.2</SectionNum>Permission modes
            </h2>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>Cycle with <kbd>Shift+Tab</kbd>, or launch into one with <code>--permission-mode</code>.</p>
            <T>
              <thead><tr><TH w="28%">Mode</TH><TH>Behavior</TH></tr></thead>
              <tbody>
                <tr><TD first><IC>default</IC></TD><TD>Prompt on every new tool pattern.</TD></tr>
                <tr><TD first><IC>acceptEdits</IC></TD><TD>Auto-accept file edits; still prompt for Bash.</TD></tr>
                <tr><TD first><IC>plan</IC></TD><TD>Research + plan only, no writes. Perfect for exploration.</TD></tr>
                <tr><TD first><IC>auto</IC></TD><TD>Classifier-based auto-approval. Review denials with <code>/permissions</code>.</TD></tr>
                <tr><TD first><IC>dontAsk</IC></TD><TD>Never prompt — use saved rules only.</TD></tr>
                <tr><TD first><IC>bypassPermissions</IC></TD><TD>Skip all checks. Equivalent to <code>--dangerously-skip-permissions</code>.</TD></tr>
              </tbody>
            </T>
            <Cmd>claude --permission-mode plan</Cmd>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>Manage saved rules: <code>/permissions</code> (alias <code>/allowed-tools</code>). Jump straight into plan mode mid-session: <code>/plan fix the auth bug</code>.</p>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>02.3</SectionNum>Session management
            </h2>
            <T>
              <thead><tr><TH w="40%">Command / flag</TH><TH>Use case</TH></tr></thead>
              <tbody>
                <tr><TD first><IC>{`claude -n "auth-refactor"`}</IC></TD><TD>Name a session — shown in <code>/resume</code> and terminal title.</TD></tr>
                <tr><TD first><IC>{`claude -r "auth-refactor" "Finish this PR"`}</IC></TD><TD>Resume by name or ID.</TD></tr>
                <tr><TD first><IC>claude --resume abc123 --fork-session</IC></TD><TD>Resume <em>and</em> create a new session ID instead of overwriting.</TD></tr>
                <tr><TD first><IC>/branch [name] / /fork</IC></TD><TD>Branch the conversation at this point; return later via <code>/resume</code>.</TD></tr>
                <tr><TD first><IC>/rename [name]</IC></TD><TD>Rename the current session; shows on the prompt bar.</TD></tr>
                <tr><TD first><IC>/export [file]</IC></TD><TD>Export conversation as plain text.</TD></tr>
                <tr><TD first><IC>/copy [N]</IC></TD><TD>Copy the last (or Nth latest) response. Press <kbd>w</kbd> in the picker to write to file.</TD></tr>
                <tr><TD first><IC>claude --from-pr 123</IC></TD><TD>Resume sessions linked to a specific GitHub PR.</TD></tr>
              </tbody>
            </T>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>02.4</SectionNum>Piping, scripting &amp; the CLI <NewBadge />
            </h2>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>Claude Code follows the Unix philosophy — pipe logs in, chain it with other tools, run it in CI.</p>
            <Cmd variant="comment">Slack yourself if log anomalies appear</Cmd>
            <Cmd>{`tail -200 app.log | claude -p "Slack me if you see any anomalies"`}</Cmd>
            <Cmd variant="comment">Review changed files for security issues</Cmd>
            <Cmd>{`git diff main --name-only | claude -p "review these changed files for security issues"`}</Cmd>
            <Cmd variant="comment">Automate translations in CI</Cmd>
            <Cmd>{`claude -p "translate new strings into French and raise a PR for review"`}</Cmd>
            <div className="caption mt-5 mb-3" style={{ letterSpacing: "0.1em" }}>Print-mode flags you&apos;ll actually use</div>
            <T>
              <thead><tr><TH w="36%">Flag</TH><TH>Purpose</TH></tr></thead>
              <tbody>
                <tr><TD first><IC>-p, --print</IC></TD><TD>Non-interactive / headless mode.</TD></tr>
                <tr><TD first><IC>--output-format text|json|stream-json</IC></TD><TD>Choose output shape for scripting.</TD></tr>
                <tr><TD first><IC>--input-format text|stream-json</IC></TD><TD>Match for stdin.</TD></tr>
                <tr><TD first><IC>--max-turns 3</IC></TD><TD>Cap agentic turns; exit on hit.</TD></tr>
                <tr><TD first><IC>--max-budget-usd 5.00</IC></TD><TD>Hard cost ceiling — stops when reached.</TD></tr>
                <tr><TD first><IC>--fallback-model sonnet</IC></TD><TD>Auto-fall back when the default model is overloaded.</TD></tr>
                <tr><TD first><IC>{`--json-schema '{...}'`}</IC></TD><TD>Validate output against a JSON Schema.</TD></tr>
                <tr><TD first><IC>--bare</IC></TD><TD>Skip auto-discovery of hooks/skills/plugins/MCP. Starts fast.</TD></tr>
              </tbody>
            </T>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>02.5</SectionNum>Git worktrees — run sessions in parallel
            </h2>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>Kick off an isolated working copy so Claude can refactor on a branch while you keep coding on <code>main</code>.</p>
            <Cmd>claude -w feature-auth</Cmd>
            <Cmd variant="comment">With tmux pane (iTerm2 uses native panes)</Cmd>
            <Cmd>claude -w feature-auth --tmux</Cmd>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem", margin: "0.5rem 0 1rem" }}>Worktrees live at <code>&lt;repo&gt;/.claude/worktrees/&lt;name&gt;</code>. Create a <code>.worktreeinclude</code> file to copy gitignored items (<code>.env</code>, local config) into the new worktree.</p>
            <div className="caption mb-3" style={{ letterSpacing: "0.1em" }}>/batch — massively parallel refactors</div>
            <Cmd>/batch migrate src/ from Solid to React</Cmd>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>Decomposes the work into 5–30 independent units, spawns one background agent per unit in its own worktree, each opens a PR. Requires a git repo.</p>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>02.6</SectionNum>In-session power features
            </h2>
            <T>
              <thead><tr><TH w="30%">Feature</TH><TH>How</TH></tr></thead>
              <tbody>
                <tr><TD first>Transcript viewer</TD><TD><kbd>Ctrl+O</kbd> — shows tool usage, expands collapsed MCP calls.</TD></tr>
                <tr><TD first>Task list</TD><TD><kbd>Ctrl+T</kbd> — in-terminal status panel. Share across sessions with <code>CLAUDE_CODE_TASK_LIST_ID=my-project</code>.</TD></tr>
                <tr><TD first>Side questions</TD><TD><code>/btw what was that config file again?</code> — ephemeral, doesn&apos;t pollute context, works <em>while Claude is processing</em>.</TD></tr>
                <tr><TD first>Context visualizer</TD><TD><code>/context</code> — color-coded grid + optimization suggestions for memory bloat.</TD></tr>
                <tr><TD first>Interactive diff</TD><TD><code>/diff</code> — uncommitted changes and per-turn diffs. Arrows to navigate files.</TD></tr>
                <tr><TD first>Session stats</TD><TD><code>/stats</code> — daily usage, streaks, model preferences.</TD></tr>
                <tr><TD first>Checkpointing / rewind</TD><TD><code>/rewind</code> or <kbd>Esc</kbd><kbd>Esc</kbd> — restore code + conversation to an earlier turn.</TD></tr>
                <tr><TD first>External editor</TD><TD><kbd>Ctrl+G</kbd> — open your prompt in <code>$EDITOR</code>.</TD></tr>
                <tr><TD first>Bash mode</TD><TD><code>! npm test</code> — runs and adds output to context. Tab-completes from history.</TD></tr>
                <tr><TD first>Background tasks</TD><TD><kbd>Ctrl+B</kbd> — background a running Bash invocation.</TD></tr>
                <tr><TD first>Reverse history search</TD><TD><kbd>Ctrl+R</kbd> — fzf-style search through your prompt history.</TD></tr>
                <tr><TD first>Voice dictation</TD><TD><code>/voice</code> then hold <kbd>Space</kbd>. Requires a claude.ai account.</TD></tr>
                <tr><TD first>Fullscreen (no flicker)</TD><TD><code>/tui fullscreen</code> — the new flicker-free rendering engine.</TD></tr>
                <tr><TD first>Vim mode</TD><TD><code>/config</code> → Editor mode → Vim. <kbd>Esc</kbd> for NORMAL, full hjkl + text objects.</TD></tr>
              </tbody>
            </T>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>02.7</SectionNum>Multi-directory &amp; multi-project
            </h2>
            <Cmd>claude --add-dir ../apps ../lib</Cmd>
            <Cmd>/add-dir ../shared</Cmd>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>Grants Claude read/edit access to additional directories. Note: <code>.claude/</code> configs in added directories are <em>not</em> auto-discovered — those only come from the primary working directory.</p>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>02.8</SectionNum>Schedule recurring work
            </h2>
            <T>
              <thead><tr><TH w="34%">Option</TH><TH>Where it runs</TH></tr></thead>
              <tbody>
                <tr><TD first><IC>/schedule → Routines</IC></TD><TD>Anthropic-managed infra. Keeps running when your machine is off. Can trigger on API calls / GitHub events.</TD></tr>
                <tr><TD first>Desktop scheduled tasks</TD><TD>Your machine. Direct access to local files + tools.</TD></tr>
                <tr><TD first><IC>/loop [interval] [prompt]</IC></TD><TD>Repeat a prompt within a single session. e.g. <code>/loop 5m check if the deploy finished</code>.</TD></tr>
              </tbody>
            </T>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>02.9</SectionNum>Mobile &amp; hand-off
            </h2>
            <T>
              <thead><tr><TH w="28%">Flow</TH><TH>How</TH></tr></thead>
              <tbody>
                <tr><TD first>Terminal → phone</TD><TD><code>/remote-control</code> (alias <code>/rc</code>) — control from claude.ai or iOS app.</TD></tr>
                <tr><TD first>Terminal → Desktop app</TD><TD><code>/desktop</code> (macOS/Win) — continue with visual diff review. Alias <code>/app</code>.</TD></tr>
                <tr><TD first>Web → terminal</TD><TD><code>claude --teleport</code> — pull a web session into your terminal.</TD></tr>
                <tr><TD first>Local → web</TD><TD><code>{`claude --remote "Fix the login bug"`}</code> — kicks off a fresh web session.</TD></tr>
                <tr><TD first>External events → session</TD><TD>Channels: wire Telegram, Discord, iMessage, or your own webhooks.</TD></tr>
              </tbody>
            </T>
          </Block>
        </section>

        {/* ================================================================ */}
        {/* 03 · EXPERT                                                      */}
        {/* ================================================================ */}
        <section id="expert" style={{ scrollMarginTop: "1.5rem", marginBottom: "5rem" }}>
          <TierHeader badge="Tier 03" badgeVariant="t3" title="Expert" subtitle="Agents, hooks, SDK, enterprise" />

          <p className="mb-8" style={{ color: "var(--ink)", fontSize: "1rem", lineHeight: 1.6 }}>
            Build your own agents, wire Claude into CI/CD, enforce policy with hooks, ship plugins, and integrate with Bedrock / Vertex / Foundry.
          </p>

          <Block hot>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>03.1</SectionNum>Subagents &amp; agent teams
            </h2>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>Subagents are isolated Claude instances with their own context, spawned by a lead agent. They&apos;re ideal for delegating bounded tasks — &ldquo;find all API endpoints&rdquo;, &ldquo;review this diff&rdquo;, &ldquo;upgrade all deps&rdquo;.</p>
            <T>
              <thead><tr><TH w="40%">Command / flag</TH><TH>What it does</TH></tr></thead>
              <tbody>
                <tr><TD first><IC>claude agents</IC></TD><TD>List all configured subagents, grouped by source.</TD></tr>
                <tr><TD first><IC>/agents</IC></TD><TD>Manage agent configurations interactively.</TD></tr>
                <tr><TD first><IC>claude --agent my-custom-agent</IC></TD><TD>Run this session as a named agent.</TD></tr>
                <tr><TD first><IC>{`claude --agents '{"reviewer": {...}}'`}</IC></TD><TD>Define dynamic subagents via JSON inline.</TD></tr>
                <tr><TD first><IC>claude --teammate-mode in-process</IC></TD><TD>Control how agent-team teammates display: <code>auto</code>, <code>in-process</code>, <code>tmux</code>.</TD></tr>
              </tbody>
            </T>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>Agents live in <code>.claude/agents/*.md</code> with YAML frontmatter. They can define their own hooks, tools, and <code>isolation: &quot;worktree&quot;</code> for sandboxed work.</p>
            <div className="caption mb-2" style={{ letterSpacing: "0.1em" }}>Example — Explore-style custom agent</div>
            <Pre>{`---
name: security-reviewer
description: Reviews diffs for security vulnerabilities
tools: Read, Grep, Glob, Bash
model: sonnet
isolation: worktree
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/security-check.sh"
---

You are a security reviewer. Check for injection, auth
issues, secret exposure, and unsafe defaults.`}</Pre>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.75rem", color: "var(--ink)" }}>
              <SectionNum>03.2</SectionNum>Hooks — the lifecycle API
            </h2>
            {[
              {
                label: "Per-session",
                items: [
                  <><code>SessionStart</code> — new or resumed session. Load dev context, set env vars via <code>CLAUDE_ENV_FILE</code>.</>,
                  <><code>SessionEnd</code> — cleanup, telemetry, state save.</>,
                  <><code>InstructionsLoaded</code> — a <code>CLAUDE.md</code> or <code>.claude/rules/*.md</code> file entered context.</>,
                ],
              },
              {
                label: "Per-turn",
                items: [
                  <><code>UserPromptSubmit</code> — validate, inject context, block, or auto-title.</>,
                  <><code>Stop</code> — Claude finished responding. Block with <code>{`decision: "block"`}</code> to continue the turn.</>,
                  <><code>StopFailure</code> — turn ended from an API error (rate limit, auth, billing).</>,
                  <><code>PreCompact / PostCompact</code> — before/after context compaction.</>,
                ],
              },
              {
                label: "Per-tool-call (inside the agentic loop)",
                items: [
                  <><code>PreToolUse</code> — <em>can block</em>. Return <code>{`permissionDecision: "allow" | "deny" | "ask" | "defer"`}</code>.</>,
                  <><code>PermissionRequest</code> — fires when a dialog is about to show. Allow/deny on the user&apos;s behalf.</>,
                  <><code>PermissionDenied</code> — auto-mode classifier denied. Return <code>retry: true</code> to let the model retry.</>,
                  <><code>PostToolUse / PostToolUseFailure</code> — after a tool succeeds / fails.</>,
                ],
              },
              {
                label: "Agent team & teammate",
                items: [
                  <><code>SubagentStart / SubagentStop</code> — when a subagent spawns / finishes.</>,
                  <><code>TaskCreated / TaskCompleted</code> — enforce task naming / completion gates.</>,
                  <><code>TeammateIdle</code> — quality gate before a teammate goes idle.</>,
                ],
              },
              {
                label: "Environment & watchers",
                items: [
                  <><code>CwdChanged</code> — react to <code>cd</code>. Write to <code>CLAUDE_ENV_FILE</code> to persist env.</>,
                  <><code>FileChanged</code> — watch literal filenames (e.g. <code>.envrc|.env</code>). Perfect for direnv-style flows.</>,
                  <><code>ConfigChange</code> — block/audit settings-file changes. Matcher filters source.</>,
                  <><code>WorktreeCreate / WorktreeRemove</code> — replace default git worktree behavior.</>,
                ],
              },
              {
                label: "MCP",
                items: [
                  <><code>Notification</code> — permission_prompt, idle_prompt, auth_success, elicitation_dialog.</>,
                  <><code>Elicitation / ElicitationResult</code> — MCP server asks for user input mid-task.</>,
                ],
              },
            ].map((group) => (
              <div key={group.label} className="mb-5">
                <div className="caption mb-2" style={{ letterSpacing: "0.1em" }}>{group.label}</div>
                <ul style={{ color: "var(--ink-muted)", fontSize: "0.875rem", paddingLeft: "1.125rem", margin: 0 }}>
                  {group.items.map((item, i) => (
                    <li key={i} style={{ marginBottom: "0.35rem" }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="caption mb-2 mt-5" style={{ letterSpacing: "0.1em" }}>Example — block destructive rm -rf</div>
            <Pre>{`{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(rm *)",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/block-rm.sh"
          }
        ]
      }
    ]
  }
}`}</Pre>
            <div className="caption mb-2 mt-4" style={{ letterSpacing: "0.1em" }}>Example — async background hook</div>
            <Pre>{`{
  "type": "command",
  "command": "./scripts/run-tests.sh",
  "async": true,
  "asyncRewake": true
}`}</Pre>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}><code>asyncRewake: true</code> runs the hook in the background and wakes Claude on exit code 2 — perfect for long test suites.</p>
            <div className="caption mb-2" style={{ letterSpacing: "0.1em" }}>Prompt-based hooks</div>
            <Pre>{`{
  "type": "prompt",
  "prompt": "Given this tool call: $ARGUMENTS, does it leak PII? Reply yes/no JSON.",
  "model": "haiku"
}`}</Pre>
            <div className="caption mb-2 mt-4" style={{ letterSpacing: "0.1em" }}>Settings file hierarchy</div>
            <T>
              <thead><tr><TH w="50%">Location</TH><TH>Scope</TH></tr></thead>
              <tbody>
                <tr><TD first><IC>~/.claude/settings.json</IC></TD><TD>User-wide (all projects)</TD></tr>
                <tr><TD first><IC>.claude/settings.json</IC></TD><TD>Project — checked in</TD></tr>
                <tr><TD first><IC>.claude/settings.local.json</IC></TD><TD>Project — gitignored</TD></tr>
                <tr><TD first>Managed policy settings</TD><TD>Organization-wide (admin)</TD></tr>
                <tr><TD first><IC>Plugin hooks/hooks.json</IC></TD><TD>Active when plugin enabled</TD></tr>
                <tr><TD first>Skill / agent frontmatter</TD><TD>Component lifetime</TD></tr>
              </tbody>
            </T>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>View everything registered: <code>/hooks</code> — read-only browser showing source, matcher, type, and full command for each.</p>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>03.3</SectionNum>Skills — your own slash commands
            </h2>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>A skill is a prompt handed to Claude. Drop a markdown file in <code>.claude/skills/</code> (project) or <code>~/.claude/skills/</code> (personal), add frontmatter, and it shows up in the <code>/</code> menu.</p>
            <div className="caption mb-2" style={{ letterSpacing: "0.1em" }}>Bundled skills (built-in)</div>
            <T>
              <thead><tr><TH w="32%">Skill</TH><TH>What it does</TH></tr></thead>
              <tbody>
                <tr><TD first><IC>/batch &lt;instruction&gt;</IC></TD><TD>Decompose a large change into 5–30 worktree-isolated parallel agents with PRs.</TD></tr>
                <tr><TD first><IC>/simplify [focus]</IC></TD><TD>Three parallel review agents aggregate findings, then fix code reuse/quality/efficiency issues.</TD></tr>
                <tr><TD first><IC>/debug [description]</IC></TD><TD>Enable debug logging + troubleshoot from the session log.</TD></tr>
                <tr><TD first><IC>/claude-api</IC></TD><TD>Load Claude API reference for your project&apos;s language. Auto-activates on <code>anthropic</code> import.</TD></tr>
                <tr><TD first><IC>/loop</IC></TD><TD>Repeat a prompt while the session stays open. <code>.claude/loop.md</code> for the default.</TD></tr>
              </tbody>
            </T>
            <div className="caption mb-2 mt-4" style={{ letterSpacing: "0.1em" }}>Custom skill skeleton</div>
            <Pre>{`---
name: review-pr
description: Review the current PR for my team's style rules
tools: Read, Grep, Bash
---

You are reviewing a pull request. Check for:
- TypeScript strict-null compliance
- Missing error handling on async functions
- Missing tests for public APIs

Output a markdown checklist of issues with file:line refs.`}</Pre>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>List available skills: <code>/skills</code>. Description listing cap is <strong>1,536 chars</strong> (raised from 250) — you get space for real triggering nuance.</p>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>03.4</SectionNum>Plugins &amp; marketplaces
            </h2>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>Plugins bundle skills, hooks, MCP servers, and agents into a single installable unit.</p>
            <Cmd>claude plugin install code-review@claude-plugins-official</Cmd>
            <Cmd>claude plugins</Cmd>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Manage interactively with <code>/plugin</code>. Hot-reload without restart: <code>/reload-plugins</code>. Load from a local directory (per-session): <code>claude --plugin-dir ./my-plugins</code>.</p>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>Plugin hooks reference bundled assets via <code>{"${CLAUDE_PLUGIN_ROOT}"}</code>; persistent data lives in <code>{"${CLAUDE_PLUGIN_DATA}"}</code> (survives plugin updates).</p>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>03.5</SectionNum>MCP — connect external systems
            </h2>
            <Cmd>claude mcp</Cmd>
            <Cmd>/mcp</Cmd>
            <div className="caption mb-2 mt-3" style={{ letterSpacing: "0.1em" }}>Load via config file</div>
            <Cmd>claude --mcp-config ./mcp.json</Cmd>
            <Cmd>claude --strict-mcp-config --mcp-config ./mcp.json</Cmd>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>MCP tools appear as <code>mcp__&lt;server&gt;__&lt;tool&gt;</code>. Match every tool from one server in hooks with <code>mcp__memory__.*</code>. MCP servers can also expose prompts as <code>/mcp__&lt;server&gt;__&lt;prompt&gt;</code>.</p>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>03.6</SectionNum>CI/CD &amp; GitHub integration
            </h2>
            <T>
              <thead><tr><TH w="32%">Integration</TH><TH>Setup</TH></tr></thead>
              <tbody>
                <tr><TD first>GitHub Actions app</TD><TD><code>/install-github-app</code> — walks through repo selection.</TD></tr>
                <tr><TD first>GitLab CI/CD</TD><TD>Dedicated runner workflow. See docs.</TD></tr>
                <tr><TD first>PR auto-review</TD><TD>Install the <code>code-review</code> plugin on the repo.</TD></tr>
                <tr><TD first>Slack app</TD><TD><code>/install-slack-app</code> — route bug reports to PRs via <code>@Claude</code>.</TD></tr>
                <tr><TD first>Auto-fix PRs</TD><TD><code>/autofix-pr [prompt]</code> — watches the current branch&apos;s PR, pushes fixes when CI fails or reviewers comment.</TD></tr>
                <tr><TD first>Long-lived OAuth token (CI)</TD><TD><code>claude setup-token</code> — prints a token for scripts. Subscription required.</TD></tr>
              </tbody>
            </T>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>03.7</SectionNum>Headless mode &amp; the Agent SDK
            </h2>
            <Cmd>{`claude -p "list all TODOs as JSON" --output-format json`}</Cmd>
            <Cmd>{`claude -p --json-schema '{"type":"object","properties":{"issues":{"type":"array"}}}' "find bugs"`}</Cmd>
            <Cmd>{`claude -p --input-format stream-json --output-format stream-json --include-hook-events "query"`}</Cmd>
            <div className="caption mb-2 mt-4" style={{ letterSpacing: "0.1em" }}>Flags that matter for scripting</div>
            <ul style={{ color: "var(--ink-muted)", fontSize: "0.875rem", paddingLeft: "1.125rem", margin: "0 0 1rem" }}>
              <li style={{ marginBottom: "0.35rem" }}><code>--bare</code> — skip auto-discovery for fast scripted calls.</li>
              <li style={{ marginBottom: "0.35rem" }}><code>--no-session-persistence</code> — don&apos;t write sessions to disk (print mode only).</li>
              <li style={{ marginBottom: "0.35rem" }}><code>--exclude-dynamic-system-prompt-sections</code> — move per-machine sections out of the system prompt so prompt-cache reuses across users/machines.</li>
              <li style={{ marginBottom: "0.35rem" }}><code>--permission-prompt-tool mcp_auth_tool</code> — route permission prompts through an MCP tool in non-interactive mode.</li>
              <li style={{ marginBottom: "0.35rem" }}><code>--session-id &lt;uuid&gt;</code> — pin a specific session ID.</li>
              <li><code>--replay-user-messages</code> — re-emit user messages back on stdout for ack (stream-json in + out).</li>
            </ul>
            <Callout>
              <CalloutLabel>New in 2.1.89+</CalloutLabel>
              <code>&quot;defer&quot;</code> as a <code>PreToolUse</code> permission decision lets SDK apps pause at a tool call, collect input via their own UI, and resume with <code>claude -p --resume &lt;id&gt;</code>. The pending call is preserved in the transcript with <code>stop_reason: &quot;tool_deferred&quot;</code>.
            </Callout>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>03.8</SectionNum>System prompt customization
            </h2>
            <T>
              <thead><tr><TH w="44%">Flag</TH><TH>Effect</TH></tr></thead>
              <tbody>
                <tr><TD first><IC>--system-prompt &quot;...&quot;</IC></TD><TD>Replace the entire system prompt.</TD></tr>
                <tr><TD first><IC>--system-prompt-file ./prompt.txt</IC></TD><TD>Replace from file.</TD></tr>
                <tr><TD first><IC>--append-system-prompt &quot;...&quot;</IC></TD><TD>Append (preserves built-in capabilities).</TD></tr>
                <tr><TD first><IC>--append-system-prompt-file ./rules.txt</IC></TD><TD>Append from file.</TD></tr>
              </tbody>
            </T>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>Append &gt; replace unless you really need total control — appending keeps all of Claude Code&apos;s built-in tool knowledge.</p>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>03.9</SectionNum>Tools — restricting what Claude can touch
            </h2>
            <T>
              <thead><tr><TH w="44%">Flag</TH><TH>Purpose</TH></tr></thead>
              <tbody>
                <tr><TD first><IC>{`--tools "Bash,Edit,Read"`}</IC></TD><TD>Restrict to a whitelist. <code>&quot;&quot;</code> disables all, <code>&quot;default&quot;</code> enables all.</TD></tr>
                <tr><TD first><IC>{`--allowedTools "Bash(git log *)" "Read"`}</IC></TD><TD>Tools that execute without permission prompts.</TD></tr>
                <tr><TD first><IC>{`--disallowedTools "Edit" "Bash(rm *)"`}</IC></TD><TD>Remove tools from the model&apos;s context entirely.</TD></tr>
                <tr><TD first><IC>--disable-slash-commands</IC></TD><TD>Nuke all skills and commands for this session.</TD></tr>
                <tr><TD first><IC>--chrome / --no-chrome</IC></TD><TD>Enable/disable the Chrome browser tool for web automation + testing.</TD></tr>
              </tbody>
            </T>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>Built-in tools: <code>Bash</code>, <code>Edit</code>, <code>Write</code>, <code>Read</code>, <code>Glob</code>, <code>Grep</code>, <code>Agent</code>, <code>WebFetch</code>, <code>WebSearch</code>, <code>AskUserQuestion</code>, <code>ExitPlanMode</code>.</p>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>03.10</SectionNum>Enterprise providers
            </h2>
            <T>
              <thead><tr><TH w="28%">Provider</TH><TH>Setup</TH></tr></thead>
              <tbody>
                <tr><TD first>Amazon Bedrock</TD><TD>Set <code>CLAUDE_CODE_USE_BEDROCK=1</code>, then <code>/setup-bedrock</code>. Opus 4.7 + Haiku 4.5 self-serve in 27 regions.</TD></tr>
                <tr><TD first>Google Vertex AI</TD><TD>Set <code>CLAUDE_CODE_USE_VERTEX=1</code>, then <code>/setup-vertex</code>.</TD></tr>
                <tr><TD first>Microsoft Foundry</TD><TD>Configure via standard env vars per docs; Opus 4.7 available.</TD></tr>
              </tbody>
            </T>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>03.11</SectionNum>Debugging &amp; diagnostics
            </h2>
            <Cmd>{`claude --debug "api,hooks,mcp"`}</Cmd>
            <Cmd>claude --debug-file /tmp/claude.log</Cmd>
            <Cmd>claude --verbose</Cmd>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>Or mid-session: <code>/debug [description]</code> starts capturing from that point. <code>/doctor</code> verifies install and press <kbd>f</kbd> to let Claude fix issues automatically.</p>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>03.12</SectionNum>Key environment variables
            </h2>
            <T>
              <thead><tr><TH w="44%">Variable</TH><TH>Effect</TH></tr></thead>
              <tbody>
                <tr><TD first><IC>ANTHROPIC_API_KEY</IC></TD><TD>API-key auth instead of subscription.</TD></tr>
                <tr><TD first><IC>CLAUDE_CODE_USE_BEDROCK=1</IC></TD><TD>Route to AWS Bedrock.</TD></tr>
                <tr><TD first><IC>CLAUDE_CODE_USE_VERTEX=1</IC></TD><TD>Route to Google Vertex AI.</TD></tr>
                <tr><TD first><IC>CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1</IC></TD><TD>Disable all background-task functionality.</TD></tr>
                <tr><TD first><IC>CLAUDE_CODE_TASK_LIST_ID=name</IC></TD><TD>Share a task list across sessions via a named dir in <code>~/.claude/tasks/</code>.</TD></tr>
                <tr><TD first><IC>CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION=false</IC></TD><TD>Disable the grayed-out prompt suggestions.</TD></tr>
                <tr><TD first><IC>CLAUDE_CODE_ENABLE_AWAY_SUMMARY=0</IC></TD><TD>Turn off automatic session recap.</TD></tr>
                <tr><TD first><IC>CLAUDE_CODE_NEW_INIT=1</IC></TD><TD>Use the interactive <code>/init</code> flow.</TD></tr>
                <tr><TD first><IC>CLAUDE_CODE_SIMPLE=1</IC></TD><TD>Equivalent to <code>--bare</code>.</TD></tr>
                <tr><TD first><IC>CLAUDE_CODE_USE_POWERSHELL_TOOL=1</IC></TD><TD>Use PowerShell as the Bash-tool shell on Windows.</TD></tr>
                <tr><TD first><IC>CLAUDE_ENV_FILE (inside hooks)</IC></TD><TD>File path to persist env vars from SessionStart / CwdChanged / FileChanged hooks.</TD></tr>
                <tr><TD first><IC>CLAUDE_PROJECT_DIR</IC></TD><TD>Project root — use in hook commands.</TD></tr>
                <tr><TD first><IC>CLAUDE_PLUGIN_ROOT / CLAUDE_PLUGIN_DATA</IC></TD><TD>Plugin install dir / persistent data dir.</TD></tr>
                <tr><TD first><IC>TRACEPARENT / TRACESTATE</IC></TD><TD>Distributed trace linking for SDK / headless sessions.</TD></tr>
              </tbody>
            </T>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>03.13</SectionNum>Security, sandboxing &amp; policy
            </h2>
            <ul style={{ color: "var(--ink-muted)", fontSize: "0.875rem", paddingLeft: "1.125rem", margin: "0 0 1rem" }}>
              <li style={{ marginBottom: "0.35rem" }}><code>/sandbox</code> — toggle sandbox mode on supported platforms.</li>
              <li style={{ marginBottom: "0.35rem" }}><code>/security-review</code> — analyze pending branch changes for injection / auth / data exposure.</li>
              <li style={{ marginBottom: "0.35rem" }}><code>/privacy-settings</code> — view/update privacy (Pro + Max only).</li>
              <li style={{ marginBottom: "0.35rem" }}>Managed-settings <code>allowManagedHooksOnly</code> blocks user/project/plugin hooks outside an org marketplace.</li>
              <li>PID-namespace isolation, credential scrubbing, hardened PowerShell permissions, command-injection fixes landed in the 2.1.x cycle.</li>
            </ul>
            <Callout variant="warn">
              <CalloutLabel variant="warn">Caution</CalloutLabel>
              <code>--dangerously-skip-permissions</code> / <code>bypassPermissions</code> — bypass exists for a reason. Use on trusted code only, and set <code>permissions.disableBypassPermissionsMode</code> at the managed-settings level if you want it off organization-wide.
            </Callout>
          </Block>
        </section>

        {/* ================================================================ */}
        {/* 04 · WHAT'S NEW                                                  */}
        {/* ================================================================ */}
        <section id="whats-new" style={{ scrollMarginTop: "1.5rem", marginBottom: "5rem" }}>
          <TierHeader badge="04" title="What's New" subtitle="Through April 2026" italic={false} />

          {/* Ribbon */}
          <div
            className="plate p-8 mb-10 relative"
            style={{
              background:   "linear-gradient(135deg, var(--paper-light), var(--paper-shadow))",
              borderColor:  "var(--prussian)",
            }}
          >
            <div
              style={{
                position:      "absolute",
                top:           "-10px",
                left:          "1.5rem",
                background:    "var(--prussian)",
                color:         "var(--paper)",
                padding:       "2px 10px",
                fontFamily:    "var(--font-mono)",
                fontSize:      "0.6rem",
                letterSpacing: "0.2em",
                fontWeight:    700,
              }}
            >
              LIVE
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, fontSize: "1.75rem", margin: "0 0 0.75rem", color: "var(--ink)", letterSpacing: "-0.01em" }}>
              Opus 4.7 — shipped April 16, 2026
            </h2>
            <ul style={{ color: "var(--ink-muted)", fontSize: "0.9rem", paddingLeft: "1.125rem", margin: 0, lineHeight: 1.7 }}>
              <li><strong>3× vision resolution</strong> (2,576 px / ~3.75 MP). XBOW visual-acuity benchmark: 54.5% → 98.5%.</li>
              <li><strong>New <code>xhigh</code> effort level</strong> sits between <code>high</code> and <code>max</code> — five levels now: low / medium / high / xhigh / max.</li>
              <li><strong>Task budgets</strong> (public beta) — token-spend guidance for longer agentic runs.</li>
              <li>CursorBench 70% (vs 58% for 4.6). 3× more production tasks resolved on Rakuten-SWE-Bench.</li>
              <li>Updated tokenizer (~1.0–1.35× token usage for the same content). <strong>Pricing unchanged</strong>: $5 / $25 per MTok.</li>
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="plate p-6" style={{ background: "var(--paper-light)" }}>
              <div className="caption mb-4" style={{ letterSpacing: "0.1em" }}>Claude Code 2.1.x highlights (Mar–Apr 2026)</div>
              <ul style={{ color: "var(--ink-muted)", fontSize: "0.875rem", paddingLeft: "1.125rem", margin: 0, lineHeight: 1.7 }}>
                <li><code>/tui fullscreen</code> — NO_FLICKER rendering engine.</li>
                <li><code>/focus</code> separated from the transcript toggle.</li>
                <li>Push notifications when Remote Control is on.</li>
                <li><code>autoScrollEnabled</code> config for fullscreen mode.</li>
                <li><code>/powerup</code> interactive animated tutorials.</li>
                <li><code>/team-onboarding</code> generates a guide from your last 30 days of usage.</li>
                <li>Skill listing cap raised <strong>250 → 1,536</strong> chars.</li>
                <li>Write-tool diff computation 60% faster on files with tabs/&amp;/$.</li>
                <li>MCP tool hanging + non-streaming retry hangs fixed.</li>
                <li>Session recap enabled even with telemetry disabled.</li>
              </ul>
            </div>
            <div className="plate p-6" style={{ background: "var(--paper-light)" }}>
              <div className="caption mb-4" style={{ letterSpacing: "0.1em" }}>Platform &amp; model changes</div>
              <ul style={{ color: "var(--ink-muted)", fontSize: "0.875rem", paddingLeft: "1.125rem", margin: 0, lineHeight: 1.7 }}>
                <li><strong>1M context window GA</strong> on Opus 4.6 and Sonnet 4.6 at standard pricing.</li>
                <li>Sonnet 4.5 and Sonnet 4 1M-context beta <strong>retires April 30, 2026</strong> — migrate to 4.6.</li>
                <li>Sonnet 4 &amp; Opus 4 retire on the API <strong>June 15, 2026</strong>. Haiku 3 retires April 19, 2026.</li>
                <li>Bedrock open to all AWS customers; Opus 4.7 + Haiku 4.5 self-serve across 27 regions.</li>
                <li>Message Batches API <code>max_tokens</code> cap raised to <strong>300K</strong>.</li>
                <li>Web search tool + programmatic tool calling now GA (no beta header).</li>
                <li>Code execution is <strong>free</strong> when used alongside web search / fetch.</li>
                <li>Claude Managed Agents (public beta) — fully managed agent harness, SSE streaming, sandboxed containers.</li>
                <li><code>ant</code> CLI for the Claude API + YAML resource versioning.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 05 · APPENDIX                                                    */}
        {/* ================================================================ */}
        <section id="appendix" style={{ scrollMarginTop: "1.5rem", marginBottom: "5rem" }}>
          <TierHeader badge="05" title="Appendix" subtitle="Fast reference" italic={false} />

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.5rem", color: "var(--ink)" }}>
              <SectionNum>A.1</SectionNum>Complete CLI flags — alphabetical
            </h2>
            <T>
              <thead><tr><TH w="40%">Flag</TH><TH>Purpose</TH></tr></thead>
              <tbody>
                {[
                  ["--add-dir", "Additional working directories."],
                  ["--agent / --agents", "Named agent / inline JSON agent defs."],
                  ["--allow-dangerously-skip-permissions", "Add bypass to Shift+Tab cycle without starting in it."],
                  ["--allowedTools / --disallowedTools", "Permissionless / forbidden tools."],
                  ["--append-system-prompt[-file]", "Append to default system prompt."],
                  ["--bare", "Minimal mode — no auto-discovery."],
                  ["--betas", "Beta headers (API-key users)."],
                  ["--channels", "External event sources (Telegram, Discord, iMessage, webhooks)."],
                  ["--chrome / --no-chrome", "Browser automation tool."],
                  ["-c, --continue", "Continue most recent conversation."],
                  ["--dangerously-skip-permissions", "Bypass all permission prompts."],
                  ["--debug / --debug-file", "Debug mode with category filtering."],
                  ["--disable-slash-commands", "Disable skills and commands."],
                  ["--effort", "low|medium|high|xhigh|max"],
                  ["--exclude-dynamic-system-prompt-sections", "Move per-machine sections → first user msg for cache reuse."],
                  ["--fallback-model", "Auto-fallback when default is overloaded."],
                  ["--fork-session", "New session ID on resume."],
                  ["--from-pr", "Resume sessions linked to a GitHub PR."],
                  ["--include-hook-events / --include-partial-messages", "Extra detail in stream-json output."],
                  ["--input-format / --output-format", "text / json / stream-json."],
                  ["--json-schema", "Validated structured output."],
                  ["--max-budget-usd / --max-turns", "Spend + turn ceilings."],
                  ["--mcp-config / --strict-mcp-config", "MCP server configuration."],
                  ["--model", "Alias (sonnet, opus) or full ID."],
                  ["-n, --name", "Display name for session."],
                  ["--no-session-persistence", "Don't write session to disk (print mode)."],
                  ["-p, --print", "Print once and exit."],
                  ["--permission-mode", "default|acceptEdits|plan|auto|dontAsk|bypassPermissions"],
                  ["--permission-prompt-tool", "MCP tool to handle permission prompts in non-interactive."],
                  ["--plugin-dir", "Per-session plugin directory."],
                  ["--remote / --rc / --remote-control", "Web session / Remote Control."],
                  ["--replay-user-messages", "Re-emit user messages (stream-json both directions)."],
                  ["-r, --resume", "Resume by ID / name, or picker."],
                  ["--session-id <uuid>", "Pin a specific UUID."],
                  ["--system-prompt[-file]", "Replace the system prompt."],
                  ["--teammate-mode", "auto|in-process|tmux"],
                  ["--teleport", "Resume web session in local terminal."],
                  ["--tmux", "tmux session for worktree."],
                  ["--tools", "Whitelist built-in tools."],
                  ["--verbose", "Full turn-by-turn output."],
                  ["-v, --version", "Version number."],
                  ["-w, --worktree", "Isolated git worktree session."],
                ].map(([flag, purpose]) => (
                  <tr key={flag}>
                    <TD first><IC>{flag}</IC></TD>
                    <TD>{purpose}</TD>
                  </tr>
                ))}
              </tbody>
            </T>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.75rem", color: "var(--ink)" }}>
              <SectionNum>A.2</SectionNum>All slash commands — quick index
            </h2>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>Not every command appears for every user — availability depends on plan, platform, and environment.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                ["/add-dir", "/agents", "/autofix-pr", "/batch", "/branch (/fork)", "/btw", "/chrome", "/claude-api", "/clear (/reset, /new)", "/color", "/compact", "/config (/settings)", "/context", "/copy", "/cost", "/debug", "/desktop (/app)", "/diff", "/doctor", "/effort", "/exit (/quit)", "/export", "/fast", "/feedback (/bug)", "/focus", "/help", "/hooks", "/ide", "/init", "/insights", "/install-github-app", "/install-slack-app"],
                ["/keybindings", "/login / /logout", "/loop (/proactive)", "/mcp", "/memory", "/model", "/passes", "/permissions (/allowed-tools)", "/plan", "/plugin", "/powerup", "/privacy-settings", "/recap", "/release-notes", "/reload-plugins", "/remote-control (/rc)", "/rename", "/resume (/continue)", "/rewind (/checkpoint)", "/sandbox", "/schedule", "/security-review", "/setup-bedrock / /setup-vertex", "/simplify", "/skills", "/stats", "/status", "/tasks (/bashes)", "/team-onboarding", "/teleport (/tp)", "/terminal-setup", "/theme", "/tui", "/ultraplan", "/upgrade", "/usage", "/voice", "/web-setup"],
              ].map((col, ci) => (
                <ul key={ci} style={{ paddingLeft: "1.125rem", margin: 0, color: "var(--ink-muted)", fontSize: "0.8375rem" }}>
                  {col.map((cmd) => (
                    <li key={cmd} style={{ marginBottom: "0.25rem" }}><code>{cmd}</code></li>
                  ))}
                </ul>
              ))}
            </div>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.75rem", color: "var(--ink)" }}>
              <SectionNum>A.3</SectionNum>The <code>.claude/</code> directory layout
            </h2>
            <Pre>{`.claude/
├── settings.json              # checked in
├── settings.local.json        # gitignored
├── agents/
│   └── security-reviewer.md   # subagent w/ YAML frontmatter
├── skills/
│   └── review-pr.md           # custom slash command
├── rules/
│   └── typescript-style.md    # lazy-loaded rules (paths: glob)
├── hooks/
│   └── block-rm.sh            # reference via $CLAUDE_PROJECT_DIR
├── loop.md                    # default /loop prompt
├── worktrees/                 # auto-created by --worktree
│   └── feature-auth/
└── tasks/                     # shared via CLAUDE_CODE_TASK_LIST_ID

CLAUDE.md                      # session-start project guide

# User-wide (~/.claude/)
~/.claude/
├── settings.json
├── agents/, skills/, rules/   # personal versions
└── tasks/`}</Pre>
          </Block>

          <Block>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: "0 0 0.75rem", color: "var(--ink)" }}>
              <SectionNum>A.4</SectionNum>Official docs — go deeper
            </h2>
            <ul style={{ color: "var(--ink-muted)", fontSize: "0.875rem", paddingLeft: "1.125rem", margin: 0, lineHeight: 2 }}>
              {[
                ["Overview",          "https://code.claude.com/docs/en/overview"],
                ["CLI reference",     "https://code.claude.com/docs/en/cli-reference"],
                ["Commands",          "https://code.claude.com/docs/en/commands"],
                ["Interactive mode",  "https://code.claude.com/docs/en/interactive-mode"],
                ["Hooks reference",   "https://code.claude.com/docs/en/hooks"],
                ["Skills",            "https://code.claude.com/docs/en/skills"],
                ["Subagents",         "https://code.claude.com/docs/en/sub-agents"],
                ["Plugins",           "https://code.claude.com/docs/en/plugins"],
                ["MCP",               "https://code.claude.com/docs/en/mcp"],
                ["Agent SDK",         "https://code.claude.com/docs/en/agent-sdk/overview"],
                ["Changelog",         "https://code.claude.com/docs/en/changelog"],
                ["What's New",        "https://code.claude.com/docs/en/whats-new"],
              ].map(([label, url]) => (
                <li key={label}>
                  <strong>{label}</strong> — <a href={url} target="_blank" rel="noopener noreferrer" className="link-ruled" style={{ fontSize: "0.8rem" }}>{url}</a>
                </li>
              ))}
            </ul>
          </Block>
        </section>

        {/* ── footer ── */}
        <footer
          className="mt-16 pt-8 border-t flex flex-wrap justify-between gap-4"
          style={{
            borderColor: "var(--rule-hair)",
            color:       "var(--ink-faint)",
            fontSize:    "0.7rem",
            fontFamily:  "var(--font-mono)",
          }}
        >
          <div>Claude Code · The Complete Cheat Sheet — April 2026 · Current through v2.1.101+ &amp; Opus 4.7</div>
          <div>
            Built for the terminal. Always verify at{" "}
            <a href="https://code.claude.com/docs/en/overview" target="_blank" rel="noopener noreferrer" className="link-ruled">
              code.claude.com
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
