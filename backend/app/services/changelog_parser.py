"""Deterministic Claude Code CHANGELOG.md parser + heuristic relevance tagger.

No LLM involvement — takes the raw markdown from the upstream CHANGELOG file
and returns structured releases with items already tagged by `kind` (from the
prose verb) and `relevance` (from keyword matches against the scaffolder's
output surface).

The LLM is an optional refinement step handled elsewhere. This module must
never fail because of model availability.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Literal

Kind = Literal["added", "fixed", "improved", "changed", "removed", "other"]
Relevance = Literal["high", "medium", "low", "none"]


@dataclass(frozen=True)
class ParsedItem:
    kind: Kind
    text: str
    relevance: Relevance
    affects: tuple[str, ...] = field(default_factory=tuple)
    summary: str = ""
    source: Literal["heuristic", "llm"] = "heuristic"


@dataclass(frozen=True)
class ParsedRelease:
    date: str
    items: tuple[ParsedItem, ...]


# --- Release + bullet regexes --------------------------------------------

_RELEASE_HEADER = re.compile(
    r"^##\s+"
    r"(?P<date>"
    r"\d+\.\d+(?:\.\d+)?"             # 2.1.110 / 1.16
    r"|"
    r"\d{4}-\d{2}-\d{2}"              # 2025-11-07
    r")\s*$"
)

_BULLET = re.compile(r"^[-*]\s+(?P<body>.+)$")
_CONTINUATION = re.compile(r"^\s{2,}\S")  # indented continuation of a bullet


# --- Kind detection -------------------------------------------------------

_KIND_PATTERNS: tuple[tuple[Kind, re.Pattern[str]], ...] = (
    ("added", re.compile(r"^(added|new\b)", re.IGNORECASE)),
    ("fixed", re.compile(r"^(fixed|fix\b)", re.IGNORECASE)),
    ("improved", re.compile(r"^(improved|enhanced|better\b)", re.IGNORECASE)),
    ("changed", re.compile(r"^(changed|updated|renamed|moved)\b", re.IGNORECASE)),
    ("removed", re.compile(r"^(removed|deprecated)\b", re.IGNORECASE)),
)


def _detect_kind(body: str) -> Kind:
    for kind, pattern in _KIND_PATTERNS:
        if pattern.match(body):
            return kind
    return "other"


# --- Heuristic relevance --------------------------------------------------

# Case-insensitive substring → affects tag. First category wins: high > medium.
_HIGH_TERMS: tuple[tuple[str, str], ...] = (
    ("CLAUDE.md", "CLAUDE.md"),
    ("SKILL.md", ".claude/skills/"),
    (".claude/settings.json", ".claude/settings.json"),
    (".mcp.json", ".mcp.json"),
    ("frontmatter", "frontmatter"),
)

# Static medium-relevance terms. Hook event names are appended dynamically
# from the catalog so adding a new event in claude_code_catalog.json
# automatically teaches the parser to flag changelog items that mention it.
_STATIC_MEDIUM_TERMS: tuple[tuple[str, str], ...] = (
    ("hook", "hooks"),
    ("subagent", ".claude/agents/"),
    ("sub-agent", ".claude/agents/"),
    ("slash command", ".claude/commands/"),
    ("/command", ".claude/commands/"),
    ("skill", ".claude/skills/"),
    ("MCP server", ".mcp.json"),
    ("MCP", ".mcp.json"),
    ("permission", ".claude/settings.json"),
    ("allowed tools", ".claude/settings.json"),
    ("settings.json", ".claude/settings.json"),
    ("agent", ".claude/agents/"),
)


def _medium_terms() -> tuple[tuple[str, str], ...]:
    """Static terms + every hook event id from the catalog.

    Resolved on each call so catalog reloads (e.g. after user extension edits)
    take effect immediately without a process restart.
    """
    from . import catalog  # local import to avoid circular deps on startup

    dynamic = tuple((eid, "hooks") for eid in catalog.hook_event_ids())
    return _STATIC_MEDIUM_TERMS + dynamic

# Strong signals that an item is unrelated to the scaffolder.
_NONE_TERMS: tuple[str, ...] = (
    "Anthropic API",
    "Messages API",
    "Claude.ai",
    " SDK ",
    "billing",
    "invoice",
    "pricing",
    "web search",  # Claude.ai feature
)


def _match_terms(text: str, terms: tuple[tuple[str, str], ...]) -> list[str]:
    low = text.lower()
    return sorted({affect for term, affect in terms if term.lower() in low})


def classify_relevance(text: str) -> tuple[Relevance, tuple[str, ...]]:
    """Heuristic (relevance, affects) for a changelog line. No LLM involved."""
    high = _match_terms(text, _HIGH_TERMS)
    if high:
        return "high", tuple(high)

    medium = _match_terms(text, _medium_terms())
    if medium:
        return "medium", tuple(medium)

    low = text.lower()
    for term in _NONE_TERMS:
        if term.lower() in low:
            return "none", ()

    # Claude-Code-adjacent but nothing the scaffolder writes.
    return "low", ()


# --- Top-level parse ------------------------------------------------------


def parse_changelog(markdown: str, max_releases: int = 12) -> list[ParsedRelease]:
    """Parse a GitHub-style CHANGELOG.md into structured releases, newest first.

    - A "release" is an H2 heading matching a version or ISO date
    - Items are top-level markdown bullets under the heading
    - Indented continuation lines are folded into the preceding bullet
    """
    releases: list[ParsedRelease] = []
    current_date: str | None = None
    current_items: list[ParsedItem] = []
    pending_body: list[str] = []  # bullet being accumulated (incl. continuations)

    def flush_bullet() -> None:
        if not pending_body:
            return
        body = " ".join(s.strip() for s in pending_body).strip()
        pending_body.clear()
        if not body:
            return
        kind = _detect_kind(body)
        relevance, affects = classify_relevance(body)
        current_items.append(
            ParsedItem(
                kind=kind,
                text=body,
                relevance=relevance,
                affects=affects,
            )
        )

    def flush_release() -> None:
        nonlocal current_date, current_items
        flush_bullet()
        if current_date is not None and current_items:
            releases.append(
                ParsedRelease(date=current_date, items=tuple(current_items))
            )
        current_date = None
        current_items = []

    for raw_line in markdown.splitlines():
        line = raw_line.rstrip()

        header = _RELEASE_HEADER.match(line)
        if header:
            flush_release()
            if len(releases) >= max_releases:
                return releases
            current_date = header.group("date")
            continue

        if current_date is None:
            continue

        bullet = _BULLET.match(line)
        if bullet:
            flush_bullet()
            pending_body.append(bullet.group("body"))
            continue

        if pending_body and _CONTINUATION.match(raw_line):
            pending_body.append(line.strip())
            continue

        # Blank line or unrelated content ends the current bullet.
        if not line.strip():
            flush_bullet()

    flush_release()
    return releases[:max_releases]
