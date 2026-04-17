"""Scaffold preset endpoints — list, save, load, delete named form snapshots."""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from ..schemas import Tier
from ..services import presets

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/presets", tags=["presets"])


class PresetSummary(BaseModel):
    id: str
    name: str
    tier: Tier
    created_at: float
    updated_at: float


class PresetFull(PresetSummary):
    data: dict[str, Any]


class PresetListResponse(BaseModel):
    presets: list[PresetSummary]


class SavePresetRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    tier: Tier
    data: dict[str, Any]


def _to_summary(entry: dict[str, Any]) -> PresetSummary:
    return PresetSummary(
        id=entry["id"],
        name=entry["name"],
        tier=entry["tier"],
        created_at=entry.get("created_at", 0.0),
        updated_at=entry.get("updated_at", 0.0),
    )


def _to_full(entry: dict[str, Any]) -> PresetFull:
    return PresetFull(
        id=entry["id"],
        name=entry["name"],
        tier=entry["tier"],
        data=entry.get("data", {}),
        created_at=entry.get("created_at", 0.0),
        updated_at=entry.get("updated_at", 0.0),
    )


@router.get("", response_model=PresetListResponse)
async def list_presets(tier: Tier | None = None) -> PresetListResponse:
    """List saved presets. Pass ?tier=expert to scope to one tier."""
    tier_value = tier.value if tier else None
    return PresetListResponse(
        presets=[_to_summary(p) for p in presets.list_presets(tier_value)]
    )


@router.get("/{preset_id}", response_model=PresetFull)
async def get_preset(preset_id: str) -> PresetFull:
    """Fetch a full preset (including form data) by id."""
    entry = presets.get_preset(preset_id)
    if entry is None:
        raise HTTPException(
            status_code=404, detail=f"Preset {preset_id!r} not found."
        )
    return _to_full(entry)


@router.post("", response_model=PresetFull)
async def save_preset(body: SavePresetRequest) -> PresetFull:
    """Save a preset. Re-saving with the same name upserts (doesn't duplicate)."""
    try:
        entry = presets.save_preset(
            name=body.name, tier=body.tier.value, data=body.data
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _to_full(entry)


@router.delete("/{preset_id}")
async def delete_preset(preset_id: str) -> Response:
    removed = presets.delete_preset(preset_id)
    if not removed:
        raise HTTPException(
            status_code=404, detail=f"Preset {preset_id!r} not found."
        )
    return Response(status_code=204)
