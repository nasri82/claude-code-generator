"""POST /api/generate — validate input, build files, return ZIP."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from ..schemas import BeginnerInput, ExpertInput, IntermediateInput, Tier
from ..services import packager

router = APIRouter(prefix="/api", tags=["generate"])


def _slug(name: str) -> str:
    import re
    return re.sub(r"[^a-z0-9-]+", "-", name.lower()).strip("-") or "project"


@router.post("/generate/beginner")
async def generate_beginner(data: BeginnerInput) -> Response:
    files = packager.build_beginner(data)
    zip_bytes = packager.make_zip(files, data.project_name)
    filename = f"{_slug(data.project_name)}-claude.zip"
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/generate/intermediate")
async def generate_intermediate(data: IntermediateInput) -> Response:
    files = packager.build_intermediate(data)
    zip_bytes = packager.make_zip(files, data.project_name)
    filename = f"{_slug(data.project_name)}-claude.zip"
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/generate/expert")
async def generate_expert(data: ExpertInput) -> Response:
    try:
        files = packager.build_expert(data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    zip_bytes = packager.make_zip(files, data.project_name)
    filename = f"{_slug(data.project_name)}-claude.zip"
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
