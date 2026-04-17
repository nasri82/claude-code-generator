"""Scaffold preset storage.

A "preset" is a saved snapshot of a tier's form input. It lets users reuse a
known-good configuration (e.g. a team's standard TS/Next defaults) instead of
re-entering all fields for every new project.

Storage is a single JSON file per backend install; presets are grouped by tier
because each tier has its own input schema. The backend deliberately does not
validate the data against the tier schema at save time — schemas evolve, and
we want old presets to remain retrievable so the user can see what fields they
need to re-fill. The frontend re-validates on load.
"""
from __future__ import annotations

import json
import logging
import re
import time
from pathlib import Path
from typing import Any

log = logging.getLogger(__name__)

STORE = Path(__file__).resolve().parent.parent.parent / ".presets.json"

_SLUG_RE = re.compile(r"[^a-z0-9-]+")
_MAX_PRESETS = 200  # Generous upper bound to keep the file small.


def _load() -> dict[str, Any]:
    if not STORE.exists():
        return {"presets": []}
    try:
        data = json.loads(STORE.read_text(encoding="utf-8"))
    except Exception as exc:
        log.warning("Could not read %s: %s — starting fresh", STORE, exc)
        return {"presets": []}
    if isinstance(data, dict) and isinstance(data.get("presets"), list):
        return data
    return {"presets": []}


def _save(data: dict[str, Any]) -> None:
    try:
        STORE.write_text(
            json.dumps(data, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
    except Exception as exc:
        log.warning("Could not write %s: %s", STORE, exc)


def _slugify(value: str) -> str:
    slug = _SLUG_RE.sub("-", value.lower()).strip("-")
    return slug or "preset"


def _make_id(tier: str, name: str) -> str:
    return f"{tier}--{_slugify(name)}"


def list_presets(tier: str | None = None) -> list[dict[str, Any]]:
    """Return presets, optionally filtered by tier, newest-updated first."""
    presets = _load()["presets"]
    if tier:
        presets = [p for p in presets if p.get("tier") == tier]
    return sorted(presets, key=lambda p: p.get("updated_at", 0.0), reverse=True)


def get_preset(preset_id: str) -> dict[str, Any] | None:
    for entry in _load()["presets"]:
        if entry.get("id") == preset_id:
            return entry
    return None


def save_preset(
    name: str,
    tier: str,
    data: dict[str, Any],
) -> dict[str, Any]:
    """Upsert a preset. Collides by (tier, slug(name)) — re-saving with the same
    name updates rather than duplicates."""
    name = name.strip()
    if not name:
        raise ValueError("Preset name is required.")

    preset_id = _make_id(tier, name)
    now = time.time()

    store = _load()
    presets: list[dict[str, Any]] = store["presets"]

    existing_idx = next(
        (i for i, p in enumerate(presets) if p.get("id") == preset_id), None
    )
    if existing_idx is not None:
        entry = presets[existing_idx]
        entry.update(
            {
                "name": name,
                "tier": tier,
                "data": data,
                "updated_at": now,
            }
        )
    else:
        entry = {
            "id": preset_id,
            "name": name,
            "tier": tier,
            "data": data,
            "created_at": now,
            "updated_at": now,
        }
        presets.insert(0, entry)

    # Cap total count so the file never grows without bound. Trim oldest.
    if len(presets) > _MAX_PRESETS:
        presets.sort(key=lambda p: p.get("updated_at", 0.0), reverse=True)
        del presets[_MAX_PRESETS:]

    store["presets"] = presets
    _save(store)
    return entry


def delete_preset(preset_id: str) -> bool:
    store = _load()
    before = len(store["presets"])
    store["presets"] = [p for p in store["presets"] if p.get("id") != preset_id]
    if len(store["presets"]) == before:
        return False
    _save(store)
    return True
