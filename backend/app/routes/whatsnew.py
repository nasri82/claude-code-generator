"""What's new — Claude Code changelog, structurally parsed, LLM-optional.

Endpoints:
- GET    /api/whatsnew             -> fetch + parse markdown + heuristic tag
- POST   /api/whatsnew/classify    -> LLM-refine relevance for one release
- GET    /api/whatsnew/applied     -> list releases the user has marked applied
- POST   /api/whatsnew/apply       -> mark a release as applied
- DELETE /api/whatsnew/applied/{date} -> unmark

Parsing is deterministic so the panel always renders real data even when the
local LLM is unreachable. Classification is an optional refinement invoked
per-release. "Apply" is a persistent user bookmark — it records adoption on
disk and keeps a human-readable log alongside the machine JSON.
"""
from __future__ import annotations

import hashlib
import json
import logging
import time
import traceback
from pathlib import Path
from typing import Any, Literal

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from ..config import settings as _settings
from ..services import applied_releases, catalog, catalog_extensions, llm
from ..services.changelog_parser import ParsedRelease, parse_changelog
from ..services.prompts import render_prompt

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/whatsnew", tags=["whatsnew"])

CHANGELOG_URL = (
    "https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md"
)
CACHE_TTL_SECONDS = 60 * 60  # 1 hour
CACHE_FILE = (
    Path(__file__).resolve().parent.parent.parent / ".whatsnew_cache.json"
)
MAX_RELEASES_PARSED = 12


# --- Schemas ---------------------------------------------------------------


class ChangelogItem(BaseModel):
    kind: Literal["added", "fixed", "improved", "changed", "removed", "other"]
    text: str
    relevance: Literal["high", "medium", "low", "none"]
    affects: list[str] = Field(default_factory=list)
    summary: str = ""
    source: Literal["heuristic", "llm"] = "heuristic"


class ChangelogRelease(BaseModel):
    date: str
    items: list[ChangelogItem]
    applied: bool = False
    applied_at: float | None = None


class WhatsNewResponse(BaseModel):
    releases: list[ChangelogRelease]
    source: str
    fetched_at: float
    age_seconds: int
    content_hash: str


class ClassifyRequest(BaseModel):
    date: str = Field(..., description="Release identifier, e.g. '2.1.110'")
    items: list[ChangelogItem]


class ClassifyResponse(BaseModel):
    date: str
    items: list[ChangelogItem]
    model: str


class ApplyRequest(BaseModel):
    date: str = Field(..., description="Release identifier, e.g. '2.1.110'")
    items: list[ChangelogItem]
    content_hash: str
    note: str = ""


class AppliedEntry(BaseModel):
    date: str
    applied_at: float
    content_hash: str
    items: list[ChangelogItem]
    note: str = ""


class ApplyResponse(AppliedEntry):
    """Returned by POST /apply. Includes what was extracted into the catalog."""

    catalog_additions: dict[str, Any] = Field(default_factory=dict)
    catalog_additions_summary: str = ""


class AppliedListResponse(BaseModel):
    applied: list[AppliedEntry]


# --- Disk cache ------------------------------------------------------------


def _now() -> float:
    return time.time()


def _load_cache() -> dict[str, Any] | None:
    if not CACHE_FILE.exists():
        return None
    try:
        data = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    except Exception as exc:
        log.warning("Could not read %s: %s", CACHE_FILE, exc)
        return None
    return data if isinstance(data, dict) else None


def _save_cache(payload: dict[str, Any]) -> None:
    try:
        CACHE_FILE.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    except Exception as exc:
        log.warning("Could not write %s: %s", CACHE_FILE, exc)


def _is_fresh(cache: dict[str, Any] | None) -> bool:
    if not cache:
        return False
    try:
        return (_now() - float(cache["fetched_at"])) < CACHE_TTL_SECONDS
    except (KeyError, TypeError, ValueError):
        return False


# --- Fetch + parse ---------------------------------------------------------


async def _fetch_markdown() -> str:
    try:
        async with httpx.AsyncClient(
            timeout=20.0,
            headers={"User-Agent": "claude-scaffolder/0.3 (+whatsnew)"},
            follow_redirects=True,
        ) as client:
            r = await client.get(CHANGELOG_URL)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Could not fetch {CHANGELOG_URL}: {exc}",
        ) from exc

    if r.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"{CHANGELOG_URL} returned {r.status_code}",
        )

    return r.text


def _serialize_releases(releases: list[ParsedRelease]) -> list[dict[str, Any]]:
    return [
        {
            "date": r.date,
            "items": [
                {
                    "kind": item.kind,
                    "text": item.text,
                    "relevance": item.relevance,
                    "affects": list(item.affects),
                    "summary": item.summary,
                    "source": item.source,
                }
                for item in r.items
            ],
        }
        for r in releases
    ]


async def _get_parsed(force: bool = False) -> dict[str, Any]:
    if not force:
        cache = _load_cache()
        if _is_fresh(cache):
            return cache  # type: ignore[return-value]

    markdown = await _fetch_markdown()
    content_hash = hashlib.sha256(markdown.encode("utf-8")).hexdigest()[:12]
    releases = parse_changelog(markdown, max_releases=MAX_RELEASES_PARSED)
    if not releases:
        raise HTTPException(
            status_code=502,
            detail="Fetched CHANGELOG.md but could not parse any releases.",
        )
    payload: dict[str, Any] = {
        "source": CHANGELOG_URL,
        "fetched_at": _now(),
        "content_hash": content_hash,
        "releases": _serialize_releases(releases),
    }
    _save_cache(payload)
    return payload


# --- Routes ----------------------------------------------------------------


@router.get("", response_model=WhatsNewResponse)
async def get_whatsnew(force: bool = False) -> WhatsNewResponse:
    """Parsed changelog with heuristic relevance tags. No LLM required."""
    data = await _get_parsed(force=force)
    applied_by_date = {
        entry["date"]: entry.get("applied_at")
        for entry in applied_releases.applied_list()
    }
    releases: list[ChangelogRelease] = []
    for r in data["releases"]:
        release = ChangelogRelease.model_validate(r)
        if release.date in applied_by_date:
            release = release.model_copy(
                update={
                    "applied": True,
                    "applied_at": applied_by_date[release.date],
                }
            )
        releases.append(release)
    return WhatsNewResponse(
        releases=releases,
        source=data["source"],
        fetched_at=data["fetched_at"],
        age_seconds=int(_now() - data["fetched_at"]),
        content_hash=data["content_hash"],
    )


@router.post("/classify", response_model=ClassifyResponse)
async def classify_release(body: ClassifyRequest) -> ClassifyResponse:
    """LLM-refine one release's items. Small prompt, survives on 7B models."""
    if not body.items:
        return ClassifyResponse(
            date=body.date, items=[], model=_settings.llm_model
        )

    try:
        prompt = render_prompt(
            "whatsnew_classify_release.md.j2",
            {
                "date": body.date,
                "items": [{"kind": i.kind, "text": i.text} for i in body.items],
                "hook_events": catalog.hook_event_ids(),
            },
        )
        system = (
            "You classify Claude Code changelog items by relevance to a "
            "project scaffolding tool. Output strict JSON only."
        )

        try:
            raw = await llm.complete_json(system=system, user=prompt)
        except llm.LLMError as exc:
            log.warning("whatsnew.classify: LLM error: %s", exc)
            raise HTTPException(status_code=503, detail=str(exc)) from exc

        raw_items = raw.get("items") if isinstance(raw, dict) else None
        if not isinstance(raw_items, list):
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "LLM did not return {'items': [...]}",
                    "raw": raw,
                },
            )

        refined: list[ChangelogItem] = []
        for i, original in enumerate(body.items):
            if i >= len(raw_items) or not isinstance(raw_items[i], dict):
                refined.append(original)
                continue
            llm_item = raw_items[i]
            refined.append(
                ChangelogItem(
                    kind=original.kind,
                    text=original.text,
                    relevance=_coerce_relevance(
                        llm_item.get("relevance"), original.relevance
                    ),
                    affects=_coerce_str_list(
                        llm_item.get("affects"), original.affects
                    ),
                    summary=_coerce_str(llm_item.get("summary")),
                    source="llm",
                )
            )

        return ClassifyResponse(
            date=body.date, items=refined, model=_settings.llm_model
        )

    except HTTPException:
        raise
    except Exception as exc:
        log.error("whatsnew.classify: unhandled\n%s", traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={
                "error": f"{type(exc).__name__}: {exc}",
                "hint": "Check the backend terminal for the full traceback.",
            },
        ) from exc


# --- Coercion helpers -----------------------------------------------------


_VALID_RELEVANCE = {"high", "medium", "low", "none"}


def _coerce_relevance(
    value: Any, fallback: Literal["high", "medium", "low", "none"]
) -> Literal["high", "medium", "low", "none"]:
    if isinstance(value, str) and value.lower() in _VALID_RELEVANCE:
        return value.lower()  # type: ignore[return-value]
    return fallback


def _coerce_str_list(value: Any, fallback: list[str]) -> list[str]:
    if isinstance(value, list):
        return [str(v) for v in value if isinstance(v, (str, int))]
    return fallback


def _coerce_str(value: Any) -> str:
    return str(value) if isinstance(value, str) else ""


# --- Apply / Applied-list routes ------------------------------------------


@router.get("/applied", response_model=AppliedListResponse)
async def get_applied() -> AppliedListResponse:
    """List releases the user has marked as applied, newest-first."""
    return AppliedListResponse(
        applied=[
            AppliedEntry.model_validate(entry)
            for entry in applied_releases.applied_list()
        ]
    )


@router.post("/apply", response_model=ApplyResponse)
async def apply(body: ApplyRequest) -> ApplyResponse:
    """Mark a release as applied and extract any new catalog entries it introduces.

    Catalog extraction is best-effort: if the LLM is unreachable or returns
    unusable output, the apply still succeeds and `catalog_additions` is empty.
    """
    items_json = [item.model_dump() for item in body.items]
    entry = applied_releases.apply_release(
        date=body.date,
        items=items_json,
        content_hash=body.content_hash,
        note=body.note,
    )

    additions = await _extract_catalog_additions(body.date, body.items)
    summary = catalog_extensions.summarize(additions)

    return ApplyResponse(
        **entry,
        catalog_additions=additions,
        catalog_additions_summary=summary,
    )


async def _extract_catalog_additions(
    date: str, items: list[ChangelogItem]
) -> dict[str, Any]:
    """Ask the LLM to extract new catalog entries from a release's items.

    Only considers items that are 'added' (new features). Returns a dict of
    already-validated, deduped, merged additions; or `{}` on any failure.
    """
    added_items = [i for i in items if i.kind == "added"]
    if not added_items:
        return {}

    cat = catalog.get_catalog()
    fm = cat.get("frontmatter_fields") or {}

    prompt = render_prompt(
        "whatsnew_extract_features.md.j2",
        {
            "date": date,
            "items": [{"kind": i.kind, "text": i.text} for i in added_items],
            "known_hook_events": catalog.hook_event_ids(),
            "known_tools": catalog.built_in_tools(),
            "known_mcp_transports": catalog.mcp_transports(),
            "known_skill_fm": fm.get("skill") or [],
            "known_agent_fm": fm.get("agent") or [],
            "known_command_fm": fm.get("command") or [],
        },
    )
    system = (
        "You extract new Claude Code feature additions from changelog items "
        "for a scaffolder tool's feature catalog. You output strict JSON only."
    )

    try:
        raw = await llm.complete_json(system=system, user=prompt)
    except llm.LLMError as exc:
        log.info(
            "whatsnew.apply: catalog extraction skipped (LLM unreachable): %s",
            exc,
        )
        return {}
    except Exception as exc:  # pragma: no cover - defensive
        log.warning("whatsnew.apply: catalog extraction crashed: %s", exc)
        return {}

    if not isinstance(raw, dict):
        return {}

    diff = catalog_extensions.validate_diff(raw)
    if not diff:
        return {}

    added = catalog_extensions.merge_and_write(diff)
    if added:
        log.info(
            "whatsnew.apply: extended catalog from release %s: %s",
            date,
            catalog_extensions.summarize(added),
        )
    return added


@router.delete("/applied/{date}")
async def unapply(date: str) -> Response:
    """Remove a release from the applied list."""
    removed = applied_releases.unapply_release(date)
    if not removed:
        raise HTTPException(
            status_code=404, detail=f"Release {date!r} is not in the applied list."
        )
    return Response(status_code=204)
