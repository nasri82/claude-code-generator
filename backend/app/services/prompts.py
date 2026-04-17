"""Prompt renderer — loads Jinja templates from app/prompts/.

Kept separate from services/renderer.py because:
- Different loader path (prompts/ vs templates/{tier}/)
- Different whitespace rules — prompts are free-form text, not Markdown/JSON
- Clearer domain separation
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

from jinja2 import ChainableUndefined, Environment, FileSystemLoader

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

_env = Environment(
    loader=FileSystemLoader(PROMPTS_DIR),
    # ChainableUndefined: missing keys render as empty string rather than raising.
    # Appropriate for prompts (LLM input) — StrictUndefined is for scaffold output.
    undefined=ChainableUndefined,
    trim_blocks=False,
    lstrip_blocks=False,
    keep_trailing_newline=False,
)


def render_prompt(template_name: str, context: dict[str, Any]) -> str:
    """Render a prompt template by filename (e.g. 'bootstrap.md.j2')."""
    template = _env.get_template(template_name)
    return template.render(**context)
