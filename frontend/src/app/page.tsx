import Link from "next/link";
import { StatusBar } from "@/components/StatusBar";

/* ── shared sub-components ────────────────────────────────────────────────── */

function ComplexityDots({ filled }: { filled: number }) {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <span className="caption">Complexity</span>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            style={{
              display:      "inline-block",
              width:        "6px",
              height:       "6px",
              borderRadius: "50%",
              background:   dot < filled ? "var(--prussian)" : "var(--rule-hair)",
              transition:   "background 0.2s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <>
      <StatusBar />

      <main className="min-h-screen px-6 py-10 max-w-7xl mx-auto">

        {/* ── Hero — title block ── */}
        <header
          className="plate plate-ticked draw-in overflow-hidden mb-10"
          style={{ background: "var(--paper-light)", position: "relative" }}
        >
          {/* Decorative oversized section mark — blueprint flavour */}
          <span
            aria-hidden
            style={{
              position:       "absolute",
              right:          "1.25rem",
              top:            "50%",
              transform:      "translateY(-50%)",
              fontFamily:     "var(--font-display)",
              fontSize:       "clamp(5rem, 16vw, 13rem)",
              fontWeight:     500,
              fontVariationSettings: "'SOFT' 0, 'opsz' 144",
              color:          "transparent",
              WebkitTextStroke: "1px var(--paper-shadow)",
              lineHeight:     1,
              letterSpacing:  "-0.05em",
              userSelect:     "none",
              pointerEvents:  "none",
            }}
          >
            §
          </span>

          <div className="p-8 md:p-10" style={{ position: "relative", zIndex: 1 }}>
            <div className="flex items-start justify-between gap-8">
              <div className="min-w-0">
                {/* eyebrow */}
                <div
                  className="caption mb-4"
                  style={{ letterSpacing: "0.3em" }}
                >
                  Sheet 1 of 1 · Blueprints for Claude Code
                </div>

                {/* Display title — Fraunces variable axes pushed hard */}
                <h1
                  style={{
                    fontSize:            "clamp(3.5rem, 7.5vw, 6.5rem)",
                    lineHeight:          0.9,
                    fontFamily:          "var(--font-display)",
                    fontWeight:          500,
                    fontVariationSettings: "'SOFT' 20, 'opsz' 144, 'WONK' 0",
                    letterSpacing:       "-0.025em",
                    color:               "var(--ink)",
                    margin:              0,
                  }}
                >
                  Claude
                  <br />
                  <span
                    style={{
                      color: "var(--prussian)",
                      /* SOFT=100 makes the serifs rounder, warmer — contrast with the straight "Claude" above */
                      fontVariationSettings: "'SOFT' 100, 'opsz' 144, 'WONK' 0",
                    }}
                  >
                    Scaffolder
                  </span>
                </h1>

                {/* Tagline */}
                <p
                  className="mt-5 max-w-lg"
                  style={{ color: "var(--ink-muted)", fontSize: "1.0625rem", lineHeight: 1.6 }}
                >
                  Generate <code>CLAUDE.md</code>, skills, commands, agents,
                  hooks, and MCP configurations. Draw up your project once,
                  keep the plates on file.
                </p>
              </div>

              {/* Technical block annotations — right margin */}
              <div
                className="hidden md:flex flex-col items-end gap-1 shrink-0 pt-1"
                style={{
                  fontFamily:    "var(--font-mono)",
                  fontSize:      "0.62rem",
                  color:         "var(--ink-faint)",
                  letterSpacing: "0.1em",
                  lineHeight:    1.9,
                }}
              >
                <div>REV · 0.2</div>
                <div>SCALE · 1:1</div>
                <div>DRAWN BY · you</div>
                <div
                  style={{
                    marginTop:   "0.6rem",
                    paddingTop:  "0.6rem",
                    borderTop:   "1px solid var(--rule-hair)",
                    color:       "var(--ochre-bold)",
                  }}
                >
                  TIER I — III
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Tier grid — asymmetric: Expert featured left, others stacked right ── */}
        {/*
          Desktop layout (md+):
          ┌─────────────────────────────┬──────────────────┐
          │  Expert  [featured, 2 rows] │  Beginner        │
          │                             ├──────────────────┤
          │                             │  Intermediate    │
          └─────────────────────────────┴──────────────────┘
        */}
        <div className="grid gap-6 md:grid-cols-2 stagger mb-6">

          {/* ── Expert — FEATURED, spans both right-col rows ── */}
          <Link
            href="/expert"
            className="plate plate-ticked plate-lift plate-featured block group tier-span-2"
          >
            <div className="p-8 flex flex-col h-full" style={{ gap: "1.25rem" }}>

              {/* Card header */}
              <div
                className="pb-4 border-b"
                style={{ borderColor: "var(--rule-hair)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span
                        style={{
                          fontFamily:    "var(--font-mono)",
                          fontSize:      "0.55rem",
                          letterSpacing: "0.18em",
                          padding:       "0.15rem 0.55rem",
                          background:    "rgba(192,138,48,0.12)",
                          color:         "var(--ochre-bold)",
                          border:        "1px solid rgba(192,138,48,0.4)",
                          borderRadius:  "2px",
                        }}
                      >
                        RECOMMENDED
                      </span>
                      <span className="caption" style={{ letterSpacing: "0.15em" }}>
                        TIER III
                      </span>
                    </div>
                    <h2
                      style={{
                        fontFamily:          "var(--font-display)",
                        fontSize:            "clamp(1.75rem, 3vw, 2.4rem)",
                        fontWeight:          500,
                        fontVariationSettings: "'SOFT' 50, 'opsz' 72",
                        lineHeight:          1.05,
                        letterSpacing:       "-0.015em",
                        margin:              0,
                      }}
                    >
                      Expert
                    </h2>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize:   "0.68rem",
                      color:      "var(--ochre-bold)",
                      paddingTop: "0.25rem",
                      flexShrink: 0,
                    }}
                  >
                    ~15 min
                  </span>
                </div>
              </div>

              {/* Tagline — more expansive since card is larger */}
              <p style={{ color: "var(--ink-muted)", fontSize: "0.9375rem", lineHeight: 1.6, margin: 0 }}>
                Full agentic scaffold. Skills, agents, hooks, MCP, MEMORY.md —
                every configuration file Claude Code understands, tuned for
                your exact project.
              </p>

              {/* Output files — 2-col grid to use the space well */}
              <div>
                <div className="caption mb-2.5">Generates</div>
                <div
                  className="grid grid-cols-2 gap-x-4"
                  style={{ gap: "0.35rem 1rem" }}
                >
                  {[
                    "CLAUDE.md",
                    "MEMORY.md",
                    ".claude/settings.json",
                    ".mcp.json",
                    ".claude/commands/*.md",
                    ".claude/skills/*/SKILL.md",
                    ".claude/agents/*.md",
                    ".claude/hooks/*.sh",
                  ].map((f) => (
                    <div
                      key={f}
                      style={{
                        fontFamily:    "var(--font-mono)",
                        fontSize:      "0.72rem",
                        color:         "var(--ink)",
                        display:       "flex",
                        alignItems:    "center",
                        gap:           "0.35rem",
                        overflow:      "hidden",
                      }}
                    >
                      <span style={{ color: "var(--prussian-soft)", flexShrink: 0 }}>›</span>
                      <span
                        style={{
                          overflow:      "hidden",
                          textOverflow:  "ellipsis",
                          whiteSpace:    "nowrap",
                        }}
                      >
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* You provide */}
              <div>
                <div className="caption mb-1.5">You provide</div>
                <p style={{ color: "var(--ink-muted)", fontSize: "0.8375rem", lineHeight: 1.55, margin: 0 }}>
                  Architecture · cross-cutting rules · skills · subagents · hooks · MCP servers
                </p>
              </div>

              {/* Footer: complexity + CTA */}
              <div
                className="mt-auto pt-4 border-t flex items-center justify-between"
                style={{ borderColor: "var(--rule-hair)" }}
              >
                <ComplexityDots filled={3} />
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize:   "0.65rem",
                      color:      "var(--ink-faint)",
                    }}
                  >
                    /expert
                  </span>
                  <span
                    className="transition-transform group-hover:translate-x-1"
                    style={{ color: "var(--prussian)", fontSize: "1.1rem" }}
                  >
                    →
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* ── Beginner ── */}
          <Link
            href="/beginner"
            className="plate plate-ticked plate-lift block p-6 group"
            style={{ background: "var(--paper-light)" }}
          >
            <div
              className="flex items-baseline justify-between mb-3 pb-3 border-b"
              style={{ borderColor: "var(--rule-hair)" }}
            >
              <div className="flex items-baseline gap-3">
                <span className="caption" style={{ letterSpacing: "0.15em" }}>TIER I</span>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize:   "1.75rem",
                    fontWeight: 500,
                    margin:     0,
                  }}
                >
                  Beginner
                </h2>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--ochre-bold)" }}>
                ~2 min
              </span>
            </div>

            <p className="mb-4" style={{ color: "var(--ink-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
              A clean CLAUDE.md and nothing you don't need.
            </p>

            <div className="mb-4">
              <div className="caption mb-1.5">Generates</div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize:   "0.72rem",
                  color:      "var(--ink)",
                  display:    "flex",
                  gap:        "0.35rem",
                }}
              >
                <span style={{ color: "var(--prussian-soft)" }}>›</span>
                CLAUDE.md
              </div>
            </div>

            <div
              className="pt-3 border-t flex items-center justify-between"
              style={{ borderColor: "var(--rule-hair)" }}
            >
              <ComplexityDots filled={1} />
              <span
                className="transition-transform group-hover:translate-x-1"
                style={{ color: "var(--prussian)" }}
              >
                →
              </span>
            </div>
          </Link>

          {/* ── Intermediate ── */}
          <Link
            href="/intermediate"
            className="plate plate-ticked plate-lift block p-6 group"
            style={{ background: "var(--paper-light)" }}
          >
            <div
              className="flex items-baseline justify-between mb-3 pb-3 border-b"
              style={{ borderColor: "var(--rule-hair)" }}
            >
              <div className="flex items-baseline gap-3">
                <span className="caption" style={{ letterSpacing: "0.15em" }}>TIER II</span>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize:   "1.75rem",
                    fontWeight: 500,
                    margin:     0,
                  }}
                >
                  Intermediate
                </h2>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--ochre-bold)" }}>
                ~5 min
              </span>
            </div>

            <p className="mb-4" style={{ color: "var(--ink-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
              Structured CLAUDE.md with architecture, commands, and permissions.
            </p>

            <div className="mb-4">
              <div className="caption mb-1.5">Generates</div>
              <div className="space-y-0.5">
                {["CLAUDE.md", ".claude/settings.json", ".claude/commands/*.md"].map((f) => (
                  <div
                    key={f}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize:   "0.72rem",
                      color:      "var(--ink)",
                      display:    "flex",
                      gap:        "0.35rem",
                    }}
                  >
                    <span style={{ color: "var(--prussian-soft)" }}>›</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <div
              className="pt-3 border-t flex items-center justify-between"
              style={{ borderColor: "var(--rule-hair)" }}
            >
              <ComplexityDots filled={2} />
              <span
                className="transition-transform group-hover:translate-x-1"
                style={{ color: "var(--prussian)" }}
              >
                →
              </span>
            </div>
          </Link>
        </div>

        {/* ── Legend callout ── */}
        <Link
          href="/legend"
          className="plate plate-ticked plate-lift block p-5 group"
          style={{ background: "var(--paper)", borderColor: "var(--rule-ink)" }}
        >
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-baseline gap-4 min-w-0">
              <span
                style={{
                  fontFamily:    "var(--font-mono)",
                  fontSize:      "0.7rem",
                  color:         "var(--ochre-bold)",
                  letterSpacing: "0.2em",
                  flexShrink:    0,
                }}
              >
                SHEET L
              </span>
              <div className="min-w-0">
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize:   "1.4rem",
                    fontWeight: 500,
                    margin:     0,
                    lineHeight: 1.15,
                  }}
                >
                  New to Claude Code?{" "}
                  <span style={{ color: "var(--prussian)" }}>Read the Legend.</span>
                </h2>
                <p
                  className="mt-1.5"
                  style={{ color: "var(--ink-muted)", fontSize: "0.875rem", lineHeight: 1.5 }}
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

        {/* ── Footer ── */}
        <footer
          className="mt-16 pt-6 border-t text-xs flex flex-wrap items-center justify-between gap-3"
          style={{
            borderColor:   "var(--rule-hair)",
            fontFamily:    "var(--font-mono)",
            color:         "var(--ink-faint)",
            letterSpacing: "0.08em",
          }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span>BACKEND · <code>localhost:8000</code></span>
            <span style={{ color: "var(--rule-hair)" }}>·</span>
            <span>FRONTEND · <code>localhost:3000</code></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/discover" className="link-ruled">Ecosystem →</Link>
            <Link href="/legend" className="link-ruled">Legend →</Link>
            <Link href="/settings" className="link-ruled">Settings →</Link>
          </div>
        </footer>
      </main>
    </>
  );
}
