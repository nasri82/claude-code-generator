"""Catalog endpoint — merged Claude Code feature catalog for frontend dropdowns."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from ..services import catalog

router = APIRouter(prefix="/api/catalog", tags=["catalog"])


@router.get("")
async def get_catalog() -> dict[str, Any]:
    """Full merged catalog (canonical + user extensions)."""
    return catalog.get_catalog()
