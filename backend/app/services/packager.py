"""Packager — orchestrates all file generation per tier and builds a ZIP.

Each tier function returns dict[path, content] which is then zipped in memory.
"""
from __future__ import annotations

import io
import zipfile
from typing import Any

from ..schemas import BeginnerInput, ExpertInput, IntermediateInput, Tier
from . import frontmatter as fm, renderer


def _slug(name: str) -> str:
    """Safe filename slug."""
    import re
    return re.sub(r"[^a-z0-9-]+", "-", name.lower()).strip("-") or "project"


def build_beginner(data: BeginnerInput) -> dict[str, str]:
    """Beginner tier: single CLAUDE.md at project root."""
    ctx = data.model_dump()
    return {
        "CLAUDE.md": renderer.render("beginner", "CLAUDE.md.j2", ctx),
    }


def build_intermediate(data: IntermediateInput) -> dict[str, str]:
    """Intermediate tier: CLAUDE.md + .claude/ folder with commands + settings."""
    ctx = data.model_dump()
    files: dict[str, str] = {
        "CLAUDE.md": renderer.render("intermediate", "CLAUDE.md.j2", ctx),
        ".claude/settings.json": renderer.render(
            "intermediate", "settings.json.j2", ctx
        ),
    }
    for cmd in data.commands:
        cmd_dump = cmd.model_dump()
        files[f".claude/commands/{cmd.name}.md"] = renderer.render(
            "intermediate",
            "commands/_command.md.j2",
            {
                "command": cmd_dump,
                "frontmatter": fm.build("command", cmd_dump),
            },
        )
    return files


def build_expert(data: ExpertInput) -> dict[str, str]:
    """Expert tier: full agentic scaffold."""
    ctx = data.model_dump()
    files: dict[str, str] = {
        "CLAUDE.md": renderer.render("expert", "CLAUDE.md.j2", ctx),
        ".claude/settings.json": renderer.render(
            "expert", "settings.json.j2", ctx
        ),
    }

    if data.include_memory_md:
        files["MEMORY.md"] = renderer.render("expert", "MEMORY.md.j2", ctx)

    if data.mcp_servers:
        files[".mcp.json"] = renderer.render("expert", "mcp.json.j2", ctx)

    for cmd in data.commands:
        cmd_dump = cmd.model_dump()
        files[f".claude/commands/{cmd.name}.md"] = renderer.render(
            "expert",
            "commands/_command.md.j2",
            {
                "command": cmd_dump,
                "frontmatter": fm.build("command", cmd_dump),
            },
        )

    for skill in data.skills:
        skill_dump = skill.model_dump()
        files[f".claude/skills/{skill.name}/SKILL.md"] = renderer.render(
            "expert",
            "skills/_skill.md.j2",
            {
                "skill": skill_dump,
                "frontmatter": fm.build("skill", skill_dump),
            },
        )

    for agent in data.agents:
        agent_dump = agent.model_dump()
        files[f".claude/agents/{agent.name}.md"] = renderer.render(
            "expert",
            "agents/_agent.md.j2",
            {
                "agent": agent_dump,
                "frontmatter": fm.build("agent", agent_dump),
            },
        )

    return files


def build_for_tier(tier: Tier, data: Any) -> dict[str, str]:
    """Dispatch to the correct builder based on tier."""
    if tier == Tier.BEGINNER:
        return build_beginner(data)
    if tier == Tier.INTERMEDIATE:
        return build_intermediate(data)
    if tier == Tier.EXPERT:
        return build_expert(data)
    raise ValueError(f"Unknown tier: {tier}")


def make_zip(files: dict[str, str], project_name: str) -> bytes:
    """Turn the {path: content} dict into an in-memory ZIP."""
    buf = io.BytesIO()
    root = _slug(project_name)
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for path, content in files.items():
            zf.writestr(f"{root}/{path}", content)
    buf.seek(0)
    return buf.read()
