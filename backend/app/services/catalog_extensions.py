"""Read / write the user-local Claude Code catalog extensions file.

Extensions are additive only — they list features the user has adopted from
applied releases (new hook events, tools, MCP transports, frontmatter fields).
The canonical catalog is never touched. See `catalog.py` for the merge logic
that composes canonical + extensions.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Iterable

from . import catalog

log = logging.getLogger(__name__)

EXTENSIONS_FILE = catalog.EXTENSIONS_FILE

# Only these keys are accepted. Anything else is discarded.
_ALLOWED_LIST_KEYS = ("hook_events", "built_in_tools", "mcp_transports")
_ALLOWED_FRONTMATTER_KINDS = ("skill", "agent", "command")


def _load_raw() -> dict[str, Any]:
    if not EXTENSIONS_FILE.exists():
        return {}
    try:
        data = json.loads(EXTENSIONS_FILE.read_text(encoding="utf-8"))
    except Exception as exc:
        log.warning("Could not read %s: %s", EXTENSIONS_FILE, exc)
        return {}
    return data if isinstance(data, dict) else {}


def _write_raw(data: dict[str, Any]) -> None:
    try:
        EXTENSIONS_FILE.write_text(
            json.dumps(data, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
    except Exception as exc:
        log.warning("Could not write %s: %s", EXTENSIONS_FILE, exc)


def _canonical_ids(key: str) -> set[str]:
    """IDs already present in the canonical catalog (to filter duplicates)."""
    canonical = catalog._load_json(catalog.CATALOG_FILE)  # type: ignore[attr-defined]
    entries = canonical.get(key) or []
    out: set[str] = set()
    for e in entries:
        if isinstance(e, str):
            out.add(e)
        elif isinstance(e, dict) and isinstance(e.get("id"), str):
            out.add(e["id"])
    return out


def _canonical_frontmatter(kind: str) -> set[str]:
    canonical = catalog._load_json(catalog.CATALOG_FILE)  # type: ignore[attr-defined]
    fields = (canonical.get("frontmatter_fields") or {}).get(kind) or []
    return {f for f in fields if isinstance(f, str)}


def _clean_hook_event(value: Any, excluded: set[str]) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    eid = value.get("id")
    if not isinstance(eid, str) or not eid.strip():
        return None
    eid = eid.strip()
    if eid in excluded:
        return None
    out: dict[str, Any] = {"id": eid}
    if isinstance(value.get("summary"), str):
        out["summary"] = value["summary"].strip()
    if isinstance(value.get("since"), str):
        out["since"] = value["since"].strip()
    return out


def _clean_str_list(
    values: Any, excluded: set[str]
) -> list[str]:
    if not isinstance(values, list):
        return []
    seen: set[str] = set()
    out: list[str] = []
    for v in values:
        if not isinstance(v, str):
            continue
        s = v.strip()
        if not s or s in excluded or s in seen:
            continue
        seen.add(s)
        out.append(s)
    return out


def validate_diff(raw: dict[str, Any]) -> dict[str, Any]:
    """Coerce an LLM-produced diff into a safe, minimal additions dict.

    Drops:
      - IDs that already exist in the canonical catalog
      - Wrong types
      - Unknown top-level keys
      - Frontmatter kinds outside {skill, agent, command}
    """
    out: dict[str, Any] = {}

    if isinstance(raw.get("hook_events"), list):
        excluded = _canonical_ids("hook_events")
        cleaned: list[dict[str, Any]] = []
        seen_ids: set[str] = set()
        for item in raw["hook_events"]:
            ce = _clean_hook_event(item, excluded)
            if ce and ce["id"] not in seen_ids:
                cleaned.append(ce)
                seen_ids.add(ce["id"])
        if cleaned:
            out["hook_events"] = cleaned

    for key in ("built_in_tools", "mcp_transports"):
        excluded = _canonical_ids(key)
        cleaned_list = _clean_str_list(raw.get(key), excluded)
        if cleaned_list:
            out[key] = cleaned_list

    fm_raw = raw.get("frontmatter_fields")
    if isinstance(fm_raw, dict):
        fm_out: dict[str, list[str]] = {}
        for kind in _ALLOWED_FRONTMATTER_KINDS:
            excluded = _canonical_frontmatter(kind)
            cleaned_fields = _clean_str_list(fm_raw.get(kind), excluded)
            if cleaned_fields:
                fm_out[kind] = cleaned_fields
        if fm_out:
            out["frontmatter_fields"] = fm_out

    return out


def _merge_list(existing: list[Any], added: list[Any]) -> tuple[list[Any], list[Any]]:
    """Append entries from `added` whose id isn't in `existing`. Returns (merged, newly_added)."""
    seen = {
        e if isinstance(e, str) else (e.get("id") if isinstance(e, dict) else None)
        for e in existing
    }
    seen.discard(None)
    newly: list[Any] = []
    merged = list(existing)
    for entry in added:
        eid = entry if isinstance(entry, str) else (entry.get("id") if isinstance(entry, dict) else None)
        if eid and eid not in seen:
            merged.append(entry)
            newly.append(entry)
            seen.add(eid)
    return merged, newly


def merge_and_write(diff: dict[str, Any]) -> dict[str, Any]:
    """Merge `diff` (already validated) into extensions file.

    Returns the subset of entries that were genuinely new (i.e. not already in
    the existing extensions file either). Also triggers a catalog reload so
    the new entries are live without a restart.
    """
    if not diff:
        return {}

    existing = _load_raw()
    added_report: dict[str, Any] = {}

    for key in _ALLOWED_LIST_KEYS:
        incoming = diff.get(key)
        if not isinstance(incoming, list):
            continue
        current = existing.get(key)
        if not isinstance(current, list):
            current = []
        merged, newly = _merge_list(current, incoming)
        existing[key] = merged
        if newly:
            added_report[key] = newly

    fm_in = diff.get("frontmatter_fields")
    if isinstance(fm_in, dict):
        fm_existing = existing.get("frontmatter_fields") or {}
        if not isinstance(fm_existing, dict):
            fm_existing = {}
        fm_report: dict[str, list[str]] = {}
        for kind, fields in fm_in.items():
            if kind not in _ALLOWED_FRONTMATTER_KINDS or not isinstance(fields, list):
                continue
            base = fm_existing.get(kind)
            if not isinstance(base, list):
                base = []
            merged, newly = _merge_list(base, fields)
            fm_existing[kind] = merged
            if newly:
                fm_report[kind] = [str(x) for x in newly]
        if fm_report:
            added_report["frontmatter_fields"] = fm_report
        existing["frontmatter_fields"] = fm_existing

    _write_raw(existing)
    catalog.reload()
    return added_report


def current() -> dict[str, Any]:
    """Read the current extensions file verbatim (for display/export)."""
    return _load_raw()


def summarize(added: dict[str, Any]) -> str:
    """Human-readable one-line summary of what `merge_and_write` returned."""
    parts: list[str] = []
    for key in _ALLOWED_LIST_KEYS:
        items = added.get(key)
        if isinstance(items, list) and items:
            label = key.replace("_", " ")
            parts.append(f"{len(items)} {label}")
    fm = added.get("frontmatter_fields") or {}
    if isinstance(fm, dict):
        total = sum(len(v) for v in fm.values() if isinstance(v, list))
        if total:
            parts.append(f"{total} frontmatter field(s)")
    if not parts:
        return "No new catalog entries extracted."
    return "Added to catalog: " + ", ".join(parts)


def iter_added_ids(added: dict[str, Any]) -> Iterable[tuple[str, str]]:
    """Flatten `added` to (category, id) pairs for logging/display."""
    for key in _ALLOWED_LIST_KEYS:
        items = added.get(key)
        if isinstance(items, list):
            for item in items:
                eid = item if isinstance(item, str) else item.get("id") if isinstance(item, dict) else None
                if isinstance(eid, str):
                    yield key, eid
    fm = added.get("frontmatter_fields") or {}
    if isinstance(fm, dict):
        for kind, fields in fm.items():
            if isinstance(fields, list):
                for f in fields:
                    if isinstance(f, str):
                        yield f"frontmatter.{kind}", f
