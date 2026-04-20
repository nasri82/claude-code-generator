"""GET /api/discover — Claude/MCP ecosystem discovery feed."""
from __future__ import annotations

from fastapi import APIRouter, Query

from ..services import discover as svc

router = APIRouter(prefix="/api/discover", tags=["discover"])


@router.get("")
async def get_discover(force: bool = Query(False, description="Bypass cache and re-fetch all sources")):
    items = await svc.fetch_all(force=force)
    by_source: dict[str, int] = {}
    by_category: dict[str, int] = {}
    for item in items:
        for src in item.get("sources", []):
            by_source[src] = by_source.get(src, 0) + 1
        cat = item.get("category", "tool")
        by_category[cat] = by_category.get(cat, 0) + 1
    return {
        "items": items,
        "total": len(items),
        "cache_age_seconds": svc.cache_age(),
        "by_source": by_source,
        "by_category": by_category,
    }
