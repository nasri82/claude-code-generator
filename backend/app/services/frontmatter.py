"""Build Claude Code frontmatter blocks from typed input models.

The catalog declares which frontmatter fields each file kind supports
(`skill`, `agent`, `command`). This module looks each declared key up on the
incoming model dump and emits a cleaned-up `{key: yaml_scalar}` dict that the
Jinja template renders verbatim — no type-specific template branches needed.

Adding a new frontmatter field typically becomes:
  1. Add the key to `frontmatter_fields` in the catalog JSON
  2. Add the matching field to the Pydantic model (optional)
That's it. Templates are unchanged.
"""
from __future__ import annotations

from typing import Any

from . import catalog

# Mapping of frontmatter key (possibly hyphenated) to Python attribute name.
# When a key doesn't appear here, the attribute name is the key itself.
_KEY_TO_ATTR: dict[str, str] = {
    "allowed-tools": "allowed_tools",
}


def _attr_name(key: str) -> str:
    return _KEY_TO_ATTR.get(key, key)


def _format(value: Any) -> Any:
    """Coerce a raw value to a YAML scalar. Return `None` to skip the key."""
    if value is None:
        return None
    if isinstance(value, str):
        stripped = value.strip()
        return stripped or None
    if isinstance(value, list):
        if not value:
            return None
        return ", ".join(str(v) for v in value if v is not None and v != "")
    if isinstance(value, dict):
        return value or None
    return value


def build(kind: str, model_dump: dict[str, Any]) -> dict[str, Any]:
    """Return the frontmatter dict for `kind` ('skill' | 'agent' | 'command')."""
    keys = catalog.get_catalog().get("frontmatter_fields", {}).get(kind, [])
    out: dict[str, Any] = {}
    for key in keys:
        if not isinstance(key, str):
            continue
        value = model_dump.get(_attr_name(key))
        formatted = _format(value)
        if formatted is None:
            continue
        out[key] = formatted
    return out
