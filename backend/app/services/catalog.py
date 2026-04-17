"""Claude Code feature catalog loader.

Exposes a merged view of:
  1. The canonical catalog shipped with the app (app/data/claude_code_catalog.json)
  2. User extensions (backend/.claude_code_extensions.json, gitignored)

User extensions are additive only — they can add entries to list-valued sections
(hook_events, built_in_tools, mcp_transports) but cannot redefine or remove
canonical ones. This keeps upgrades safe: a canonical entry can't be silently
shadowed by a stale local extension.

Loading is cached in-process; call `reload()` to force a re-read (e.g. after
applying a release extends the extensions file).
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

log = logging.getLogger(__name__)

_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
CATALOG_FILE = _BACKEND_ROOT / "app" / "data" / "claude_code_catalog.json"
EXTENSIONS_FILE = _BACKEND_ROOT / ".claude_code_extensions.json"

# Keys where extensions append entries (not overwrite).
_LIST_MERGE_KEYS = ("hook_events", "built_in_tools", "mcp_transports")

_cached: dict[str, Any] | None = None


def _load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        log.warning("Could not read %s: %s", path, exc)
        return {}
    return data if isinstance(data, dict) else {}


def _entry_id(entry: Any) -> str | None:
    if isinstance(entry, str):
        return entry
    if isinstance(entry, dict) and isinstance(entry.get("id"), str):
        return entry["id"]
    return None


def _merge_list(canonical: list[Any], extension: list[Any]) -> list[Any]:
    """Append extension entries whose id is not already in canonical."""
    seen = {_entry_id(e) for e in canonical}
    seen.discard(None)
    out = list(canonical)
    for entry in extension:
        eid = _entry_id(entry)
        if eid and eid not in seen:
            out.append(entry)
            seen.add(eid)
    return out


def _merge(canonical: dict[str, Any], extensions: dict[str, Any]) -> dict[str, Any]:
    merged: dict[str, Any] = dict(canonical)
    for key in _LIST_MERGE_KEYS:
        c_list = canonical.get(key)
        e_list = extensions.get(key)
        if isinstance(c_list, list) and isinstance(e_list, list):
            merged[key] = _merge_list(c_list, e_list)
    # Frontmatter fields merge per nested-key list:
    c_fm = canonical.get("frontmatter_fields") or {}
    e_fm = extensions.get("frontmatter_fields") or {}
    if isinstance(c_fm, dict) and isinstance(e_fm, dict):
        merged_fm: dict[str, list[str]] = {
            k: list(v) if isinstance(v, list) else [] for k, v in c_fm.items()
        }
        for k, v in e_fm.items():
            if isinstance(v, list):
                base = merged_fm.get(k, [])
                merged_fm[k] = _merge_list(base, v)
        merged["frontmatter_fields"] = merged_fm
    return merged


def get_catalog() -> dict[str, Any]:
    """Return the merged catalog (canonical + user extensions). Cached."""
    global _cached
    if _cached is None:
        canonical = _load_json(CATALOG_FILE)
        extensions = _load_json(EXTENSIONS_FILE)
        _cached = _merge(canonical, extensions)
    return _cached


def reload() -> dict[str, Any]:
    """Force re-read from disk."""
    global _cached
    _cached = None
    return get_catalog()


# --- Convenience accessors for other services ---------------------------


def hook_event_ids() -> list[str]:
    events = get_catalog().get("hook_events") or []
    out: list[str] = []
    for e in events:
        eid = _entry_id(e)
        if eid:
            out.append(eid)
    return out


def built_in_tools() -> list[str]:
    tools = get_catalog().get("built_in_tools") or []
    return [t for t in tools if isinstance(t, str)]


def mcp_transports() -> list[str]:
    items = get_catalog().get("mcp_transports") or []
    return [t for t in items if isinstance(t, str)]
