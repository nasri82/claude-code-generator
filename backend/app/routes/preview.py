"""POST /api/preview — return rendered files as JSON for the live preview panel.

Response shape:
{
  "files": [
    {"path": "CLAUDE.md", "content": "# ...", "language": "markdown"},
    ...
  ]
}
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..schemas import BeginnerInput, ExpertInput, IntermediateInput
from ..services import packager

router = APIRouter(prefix="/api", tags=["preview"])


def _language_for(path: str) -> str:
    if path.endswith(".md"):
        return "markdown"
    if path.endswith(".json"):
        return "json"
    if path.endswith(".sh"):
        return "bash"
    if path.endswith(".yml") or path.endswith(".yaml"):
        return "yaml"
    return "plaintext"


def _to_response(files: dict[str, str]) -> dict:
    return {
        "files": [
            {"path": path, "content": content, "language": _language_for(path)}
            for path, content in sorted(files.items())
        ]
    }


@router.post("/preview/beginner")
async def preview_beginner(data: BeginnerInput) -> dict:
    try:
        return _to_response(packager.build_beginner(data))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/preview/intermediate")
async def preview_intermediate(data: IntermediateInput) -> dict:
    try:
        return _to_response(packager.build_intermediate(data))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/preview/expert")
async def preview_expert(data: ExpertInput) -> dict:
    try:
        return _to_response(packager.build_expert(data))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
