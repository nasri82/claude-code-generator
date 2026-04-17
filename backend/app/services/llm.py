"""LLM client — OpenAI-compatible chat completions over httpx.

Works with:
- Ollama (http://localhost:11434/v1)
- LM Studio (http://localhost:1234/v1)
- vLLM, llama.cpp server, OpenAI itself, etc.

Why httpx not the openai SDK: fewer deps, no version churn, and the
OpenAI-compat surface we need is trivial (one endpoint, one schema).
"""
from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from ..config import settings

log = logging.getLogger(__name__)


class LLMError(RuntimeError):
    """Raised when the LLM call fails in a way callers should surface to the user."""


async def _chat(
    system: str,
    user: str,
    *,
    json_mode: bool = False,
    model: str | None = None,
    temperature: float | None = None,
) -> str:
    """Low-level chat call. Returns the assistant message content."""
    payload: dict[str, Any] = {
        "model": model or settings.llm_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": (
            temperature if temperature is not None else settings.llm_temperature
        ),
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    headers = {"Authorization": f"Bearer {settings.llm_api_key}"}
    url = f"{settings.llm_base_url.rstrip('/')}/chat/completions"

    async with httpx.AsyncClient(timeout=settings.llm_timeout) as client:
        try:
            r = await client.post(url, headers=headers, json=payload)
        except httpx.RequestError as exc:
            raise LLMError(
                f"Could not reach LLM at {url}. "
                f"Is Ollama running? ({exc})"
            ) from exc

    if r.status_code != 200:
        raise LLMError(f"LLM returned {r.status_code}: {r.text[:500]}")

    data = r.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        raise LLMError(f"Unexpected LLM response shape: {data}") from exc


async def complete_text(
    system: str,
    user: str,
    *,
    model: str | None = None,
    temperature: float | None = None,
) -> str:
    """Plain text completion — for field-level assist and review."""
    return await _chat(
        system,
        user,
        json_mode=False,
        model=model,
        temperature=temperature,
    )


async def complete_json(
    system: str,
    user: str,
    *,
    model: str | None = None,
    temperature: float | None = None,
    max_retries: int = 1,
) -> dict:
    """JSON completion with one retry on parse failure.

    Some models ignore `response_format` and wrap JSON in markdown fences.
    We strip those before parsing as a safety net.
    """
    last_err: Exception | None = None
    for attempt in range(max_retries + 1):
        raw = await _chat(
            system,
            user,
            json_mode=True,
            model=model,
            temperature=temperature,
        )
        cleaned = _strip_fences(raw)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            last_err = exc
            log.warning(
                "LLM returned non-JSON on attempt %d. First 200 chars: %s",
                attempt + 1,
                raw[:200],
            )
            if attempt < max_retries:
                user = (
                    user
                    + "\n\nYour previous reply was not valid JSON. "
                    "Return ONLY a JSON object, no prose, no markdown fences."
                )
    raise LLMError(f"LLM did not return valid JSON after retries: {last_err}")


def _strip_fences(text: str) -> str:
    """Remove ```json ... ``` or ``` ... ``` fences if the model added them."""
    stripped = text.strip()
    if stripped.startswith("```"):
        # drop first line (```json or ```)
        first_newline = stripped.find("\n")
        if first_newline != -1:
            stripped = stripped[first_newline + 1 :]
        # drop trailing ``` if present
        if stripped.rstrip().endswith("```"):
            stripped = stripped.rstrip()[:-3]
    return stripped.strip()


async def health_check() -> dict:
    """Quick check that the LLM endpoint responds."""
    url = f"{settings.llm_base_url.rstrip('/')}/models"
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            r = await client.get(url, headers={"Authorization": f"Bearer {settings.llm_api_key}"})
            if r.status_code == 200:
                return {"ok": True, "base_url": settings.llm_base_url, "model": settings.llm_model}
            return {"ok": False, "base_url": settings.llm_base_url, "status": r.status_code}
        except httpx.RequestError as exc:
            return {"ok": False, "base_url": settings.llm_base_url, "error": str(exc)}
