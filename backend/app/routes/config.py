"""LLM configuration endpoints for the settings UI.

Runtime-mutable. Changes live in-memory until backend restart.
On restart, env vars win.
"""
from __future__ import annotations

import time
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..config import settings
from ..services import llm

router = APIRouter(prefix="/api/config", tags=["config"])


class LLMConfigResponse(BaseModel):
    llm_base_url: str
    llm_model: str
    llm_api_key: str  # always masked on responses
    llm_timeout: float
    llm_temperature: float
    overrides: dict  # keys differing from env baseline
    configured: bool


class LLMConfigUpdate(BaseModel):
    llm_base_url: str | None = Field(None, min_length=1, max_length=500)
    llm_model: str | None = Field(None, min_length=1, max_length=200)
    llm_api_key: str | None = Field(None, max_length=500)
    llm_timeout: float | None = Field(None, ge=1, le=900)
    llm_temperature: float | None = Field(None, ge=0, le=2)


class TestResult(BaseModel):
    ok: bool
    latency_ms: int | None = None
    model: str | None = None
    message: str


class ModelInfo(BaseModel):
    id: str
    current: bool = False


class ModelListResponse(BaseModel):
    models: list[ModelInfo]
    source: str  # the base URL queried
    error: str | None = None


@router.get("/llm", response_model=LLMConfigResponse)
async def get_config() -> LLMConfigResponse:
    """Current effective LLM config (API key masked)."""
    data = settings.as_dict(mask_key=True)
    return LLMConfigResponse(
        **data,
        overrides=settings.diff_from_env(),
        configured=settings.llm_configured,
    )


@router.post("/llm", response_model=LLMConfigResponse)
async def update_config(body: LLMConfigUpdate) -> LLMConfigResponse:
    """Apply runtime override. Fields left null are unchanged.

    Sentinel: if `llm_api_key` is the masked value (contains '••'), we don't overwrite.
    This lets the UI submit the whole form without having to re-enter the key.
    """
    payload = body.model_dump(exclude_none=True)
    if "llm_api_key" in payload and "•" in payload["llm_api_key"]:
        payload.pop("llm_api_key")
    settings.update(**payload)
    return await get_config()


@router.post("/llm/reset", response_model=LLMConfigResponse)
async def reset_config() -> LLMConfigResponse:
    """Discard runtime overrides, restore env baseline."""
    settings.reset_to_env()
    return await get_config()


@router.post("/llm/test", response_model=TestResult)
async def test_config() -> TestResult:
    """Trivial round-trip against the current endpoint to verify reachability."""
    start = time.perf_counter()
    try:
        raw = await llm.complete_text(
            system="Reply with the single word: pong.",
            user="ping",
            temperature=0.0,
        )
        latency_ms = int((time.perf_counter() - start) * 1000)
        return TestResult(
            ok=True,
            latency_ms=latency_ms,
            model=settings.llm_model,
            message=f"Responded in {latency_ms}ms. Reply: {raw.strip()[:80]!r}",
        )
    except llm.LLMError as exc:
        return TestResult(ok=False, message=str(exc))
    except Exception as exc:
        return TestResult(ok=False, message=f"Unexpected: {exc}")


@router.get("/llm/models", response_model=ModelListResponse)
async def list_models() -> ModelListResponse:
    """GET /v1/models on the configured endpoint (OpenAI-compatible)."""
    url = f"{settings.llm_base_url.rstrip('/')}/models"
    headers = {"Authorization": f"Bearer {settings.llm_api_key}"}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url, headers=headers)
    except httpx.RequestError as exc:
        return ModelListResponse(
            models=[], source=settings.llm_base_url, error=f"Cannot reach {url}: {exc}"
        )
    if r.status_code != 200:
        return ModelListResponse(
            models=[],
            source=settings.llm_base_url,
            error=f"{url} returned {r.status_code}: {r.text[:200]}",
        )
    try:
        data = r.json().get("data", [])
    except Exception:
        return ModelListResponse(
            models=[], source=settings.llm_base_url, error="Non-JSON response"
        )
    current = settings.llm_model
    return ModelListResponse(
        models=[
            ModelInfo(id=m.get("id", ""), current=m.get("id") == current)
            for m in data
            if m.get("id")
        ],
        source=settings.llm_base_url,
    )
