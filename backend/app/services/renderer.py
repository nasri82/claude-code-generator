"""Template rendering service.

Single source of truth for Jinja rendering. Used by both preview and generate.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"


def _make_env(subdir: str) -> Environment:
    """Create a Jinja env scoped to a tier's template directory."""
    return Environment(
        loader=FileSystemLoader(TEMPLATES_DIR / subdir),
        autoescape=select_autoescape(enabled_extensions=("html", "xml")),
        undefined=StrictUndefined,
        trim_blocks=False,
        lstrip_blocks=False,
        keep_trailing_newline=True,
    )


def render(tier: str, template_name: str, context: dict[str, Any]) -> str:
    """Render a template from a specific tier with the given context."""
    env = _make_env(tier)
    template = env.get_template(template_name)
    return template.render(**context)


def render_string(tier: str, template_name: str, context: dict[str, Any]) -> str:
    """Alias for render — explicit that a string is returned."""
    return render(tier, template_name, context)
