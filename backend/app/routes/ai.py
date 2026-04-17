"""AI endpoints — LLM-assisted form population, field suggestions, and review.

All endpoints share the same LLM client. If the LLM is unreachable, endpoints
return a 503 with actionable error text (so the frontend can show a helpful message).
"""
from __future__ import annotations

import json
import logging
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..config import settings
from ..schemas import BeginnerInput, ExpertInput, IntermediateInput, Tier
from ..services import llm
from ..services.prompts import render_prompt

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["ai"])


# --- Schemas ---------------------------------------------------------------


class BootstrapRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=4000)


class AssistRequest(BaseModel):
    kind: Literal[
        "skill_body",
        "agent_prompt",
        "cross_cutting_rules",
        "command_body",
    ]
    # Context varies per kind; the route validates what it needs.
    context: dict[str, Any]


class AssistResponse(BaseModel):
    kind: str
    content: Any  # str for text kinds, list[dict] for cross_cutting_rules


class ReviewRequest(BaseModel):
    tier: Tier
    data: dict  # The tier input, already filled — we'll re-render files


class ReviewFinding(BaseModel):
    kind: Literal["missing", "vague", "risky", "praise"]
    where: str
    what: str
    suggestion: str | None = None


class ReviewResponse(BaseModel):
    summary: str
    findings: list[ReviewFinding]


# --- Helpers --------------------------------------------------------------


_EXAMPLES: dict[Tier, dict] = {
    Tier.BEGINNER: {
        "project_name": "price-scraper",
        "one_liner": "FastAPI service that scrapes product prices from e-commerce sites.",
        "tech_stack": {
            "language": "Python",
            "framework": "FastAPI",
            "database": "PostgreSQL",
            "extras": ["Celery", "httpx"],
        },
        "run_command": "uvicorn app.main:app --reload",
        "conventions": [
            {"rule": "All scraper logic lives under app/scrapers/", "rationale": "Keeps side-effects isolated"},
            {"rule": "Every scraper returns a dataclass, never a dict"},
        ],
    },
    Tier.INTERMEDIATE: {
        "project_name": "price-scraper",
        "one_liner": "FastAPI price scraper with scheduled jobs.",
        "tech_stack": {
            "language": "Python",
            "framework": "FastAPI",
            "database": "PostgreSQL",
            "extras": ["Celery", "Redis", "httpx"],
        },
        "architecture": {
            "summary": "HTTP layer in routes/, scraping logic in scrapers/, DB access in repositories/. Celery beat triggers scheduled scrapes.",
            "key_directories": {
                "app/routes": "HTTP endpoints",
                "app/scrapers": "Per-site scraper implementations",
                "app/repositories": "Postgres access",
                "app/tasks": "Celery tasks",
            },
        },
        "run_command": "uvicorn app.main:app --reload",
        "test_command": "pytest",
        "conventions": [
            {"rule": "All scraper logic lives under app/scrapers/"},
            {"rule": "No raw SQL outside repositories"},
        ],
        "commands": [
            {
                "name": "scrape",
                "description": "Run a one-off scrape for a single site",
                "body": "Run the scraper for the site named in $ARGUMENTS. Print the results without writing to DB.",
            }
        ],
        "allowed_tools": ["Read", "Edit", "Bash", "Glob", "Grep"],
    },
    Tier.EXPERT: {
        "project_name": "price-scraper",
        "one_liner": "Multi-tenant FastAPI price scraper with scheduled jobs and audit logging.",
        "tech_stack": {
            "language": "Python",
            "framework": "FastAPI",
            "database": "PostgreSQL",
            "extras": ["Celery", "Redis", "httpx", "pgvector"],
        },
        "architecture": {
            "summary": "Multi-tenant with PostgreSQL RLS. Scrapers are pluggable per-site modules. Celery for scheduling, audit trail via append-only events.",
            "key_directories": {
                "app/routes": "HTTP endpoints",
                "app/scrapers": "Per-site scrapers",
                "app/repositories": "Postgres access with RLS",
                "app/tasks": "Celery tasks",
                "app/events": "Append-only audit log",
            },
        },
        "run_command": "uvicorn app.main:app --reload",
        "test_command": "pytest",
        "build_command": "docker compose build",
        "conventions": [
            {"rule": "All scraper logic under app/scrapers/"},
            {"rule": "No raw SQL outside repositories"},
        ],
        "cross_cutting_rules": [
            {"category": "Security", "rule": "Never log API keys or tenant credentials", "rationale": "Multi-tenant PII risk"},
            {"category": "Security", "rule": "RLS on every tenant-scoped table"},
            {"category": "Observability", "rule": "Every mutation emits an audit event with SHA-256 hash"},
            {"category": "Data integrity", "rule": "Scrapers write through repositories only, never direct to Postgres"},
        ],
        "commands": [
            {
                "name": "scrape",
                "description": "Run a one-off scrape for a single site",
                "body": "Run the scraper for the site named in $ARGUMENTS. Print the results without writing to DB.",
            }
        ],
        "skills": [
            {
                "name": "add-scraper",
                "description": "Use when the user asks to add support for a new e-commerce site. Walks through creating the scraper module, tests, and registration.",
                "body": "...",
            }
        ],
        "agents": [],
        "hooks": [],
        "mcp_servers": [],
        "include_memory_md": True,
        "allowed_tools": ["Read", "Edit", "Write", "Bash", "Glob", "Grep", "WebFetch"],
        "denied_tools": [],
    },
}


_SCHEMA_BY_TIER: dict[Tier, type[BaseModel]] = {
    Tier.BEGINNER: BeginnerInput,
    Tier.INTERMEDIATE: IntermediateInput,
    Tier.EXPERT: ExpertInput,
}


def _schema_json(tier: Tier) -> str:
    """Dump the Pydantic schema as pretty JSON for the LLM."""
    model = _SCHEMA_BY_TIER[tier]
    return json.dumps(model.model_json_schema(), indent=2)


# --- Routes ---------------------------------------------------------------


@router.get("/health")
async def ai_health() -> dict:
    """Check if the configured LLM endpoint responds."""
    return await llm.health_check()


@router.post("/bootstrap/{tier}")
async def bootstrap(tier: Tier, body: BootstrapRequest) -> dict:
    """Populate a tier form from a free-text project description."""
    model_cls = _SCHEMA_BY_TIER[tier]
    prompt_user = render_prompt(
        "bootstrap.md.j2",
        {
            "tier": tier.value,
            "schema_json": _schema_json(tier),
            "example_json": json.dumps(_EXAMPLES[tier], indent=2),
        },
    )
    system = (
        "You fill Claude Code project scaffold forms. You output strict JSON matching "
        "the provided schema. You never include prose, commentary, or markdown fences."
    )
    user = f"{prompt_user}\n\n---\n\nUser description:\n\n{body.description}"

    try:
        raw = await llm.complete_json(system=system, user=user)
    except llm.LLMError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    # Validate against the tier schema; raise 422 with details if invalid.
    try:
        validated = model_cls.model_validate(raw)
    except Exception as exc:
        log.warning("LLM output failed validation: %s", exc)
        raise HTTPException(
            status_code=422,
            detail={
                "error": "LLM output did not match the tier schema.",
                "pydantic_error": str(exc),
                "raw": raw,
            },
        ) from exc
    return validated.model_dump(mode="json")


@router.post("/assist", response_model=AssistResponse)
async def assist(body: AssistRequest) -> AssistResponse:
    """Suggest content for a single form field."""
    kind = body.kind
    ctx = body.context

    try:
        # Each kind has its own template and handling.
        if kind == "skill_body":
            required = ["project_name", "skill_name", "skill_description"]
            _require(ctx, required)
            prompt = render_prompt("assist_skill_body.md.j2", ctx)
            content = await llm.complete_text(
                system="You write Claude Code skill bodies. Output only markdown, no fences.",
                user=prompt,
            )
            return AssistResponse(kind=kind, content=content.strip())

        if kind == "agent_prompt":
            _require(ctx, ["project_name", "agent_name", "agent_description"])
            prompt = render_prompt("assist_agent_prompt.md.j2", ctx)
            content = await llm.complete_text(
                system="You write Claude Code subagent system prompts. Output only the prompt text.",
                user=prompt,
            )
            return AssistResponse(kind=kind, content=content.strip())

        if kind == "command_body":
            _require(ctx, ["project_name", "command_name", "command_description"])
            prompt = render_prompt("assist_command_body.md.j2", ctx)
            content = await llm.complete_text(
                system="You write Claude Code slash command bodies. Output only the prompt text.",
                user=prompt,
            )
            return AssistResponse(kind=kind, content=content.strip())

        if kind == "cross_cutting_rules":
            _require(ctx, ["project_name", "tech_stack"])
            prompt = render_prompt("assist_cross_cutting_rules.md.j2", ctx)
            data = await llm.complete_json(
                system="You suggest cross-cutting rules. Output only a JSON array.",
                user=prompt,
            )
            # complete_json returns dict; LLMs sometimes wrap arrays in {"rules": [...]}
            if isinstance(data, dict):
                for key in ("rules", "items", "data"):
                    if key in data and isinstance(data[key], list):
                        data = data[key]
                        break
            if not isinstance(data, list):
                raise HTTPException(
                    status_code=422,
                    detail=f"Expected JSON array of rules, got {type(data).__name__}",
                )
            return AssistResponse(kind=kind, content=data)

        raise HTTPException(status_code=400, detail=f"Unknown assist kind: {kind}")
    except llm.LLMError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/review", response_model=ReviewResponse)
async def review(body: ReviewRequest) -> ReviewResponse:
    """Post-generation review. Takes tier data, renders files, returns findings."""
    from ..services import packager

    model_cls = _SCHEMA_BY_TIER[body.tier]
    try:
        validated = model_cls.model_validate(body.data)
    except Exception as exc:
        raise HTTPException(
            status_code=422, detail=f"Input failed validation: {exc}"
        ) from exc

    files = packager.build_for_tier(body.tier, validated)
    files_for_prompt = [
        {
            "path": p,
            "content": c,
            "language": _language_for(p),
        }
        for p, c in sorted(files.items())
    ]

    prompt = render_prompt("review.md.j2", {"files": files_for_prompt})
    try:
        data = await llm.complete_json(
            system=(
                "You are a senior architect reviewing a Claude Code scaffold. "
                "Output only a JSON object matching the requested shape."
            ),
            user=prompt,
        )
    except llm.LLMError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    try:
        return ReviewResponse.model_validate(data)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail={"error": "Review output malformed", "raw": data, "pydantic_error": str(exc)},
        ) from exc


# --- Small helpers --------------------------------------------------------


def _require(ctx: dict, keys: list[str]) -> None:
    missing = [k for k in keys if k not in ctx]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required context keys: {missing}",
        )


def _language_for(path: str) -> str:
    if path.endswith(".md"):
        return "markdown"
    if path.endswith(".json"):
        return "json"
    return "plaintext"
