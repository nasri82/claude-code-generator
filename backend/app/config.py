"""Runtime configuration with file-based persistence.

Priority (highest wins):
1. Runtime overrides from the UI  (persisted to .llm_config.json)
2. Environment variables
3. Built-in defaults

Usage:
    from .config import settings
    settings.llm_model                 # current effective value
    settings.update(llm_model="...")   # runtime override (auto-saved)
    settings.reset_to_env()            # discard overrides, delete saved config
"""
from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, field, fields
from pathlib import Path
from typing import Any

from filelock import FileLock

log = logging.getLogger(__name__)

# Persisted config lives next to the backend package (gitignored).
_CONFIG_FILE = Path(__file__).resolve().parent.parent / ".llm_config.json"
_LOCK = FileLock(str(_CONFIG_FILE) + ".lock")

_PERSIST_KEYS = frozenset(
    {"llm_base_url", "llm_model", "llm_api_key", "llm_timeout", "llm_temperature"}
)


def _env_baseline() -> dict[str, Any]:
    """Snapshot of env-derived values. Preserved for reset-to-env."""
    return {
        "llm_base_url": os.getenv("LLM_BASE_URL", "http://localhost:11434/v1"),
        "llm_model": os.getenv("LLM_MODEL", "qwen2.5-coder:7b"),
        "llm_api_key": os.getenv("LLM_API_KEY", "ollama"),
        "llm_timeout": float(os.getenv("LLM_TIMEOUT", "120")),
        "llm_temperature": float(os.getenv("LLM_TEMPERATURE", "0.3")),
    }


def _load_saved() -> dict[str, Any]:
    """Load persisted config from disk. Returns empty dict on any failure."""
    try:
        if _CONFIG_FILE.exists():
            data = json.loads(_CONFIG_FILE.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                log.info("Loaded saved LLM config from %s", _CONFIG_FILE)
                return {k: v for k, v in data.items() if k in _PERSIST_KEYS}
    except Exception as exc:
        log.warning("Could not load saved config from %s: %s", _CONFIG_FILE, exc)
    return {}


def _save(data: dict[str, Any]) -> None:
    """Persist config to disk."""
    try:
        _CONFIG_FILE.write_text(
            json.dumps(data, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        log.info("Saved LLM config to %s", _CONFIG_FILE)
    except Exception as exc:
        log.warning("Could not save config to %s: %s", _CONFIG_FILE, exc)


@dataclass
class Settings:
    llm_base_url: str = ""
    llm_model: str = ""
    llm_api_key: str = ""
    llm_timeout: float = 120.0
    llm_temperature: float = 0.3
    _baseline: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self._baseline:
            self._baseline = _env_baseline()
            # Start from env defaults — assign directly (do NOT call
            # reset_to_env here; reset_to_env intentionally deletes the
            # saved-config file and we want to read it next).
            for key, value in self._baseline.items():
                setattr(self, key, value)
            saved = _load_saved()
            if saved:
                for key, value in saved.items():
                    setattr(self, key, value)

    @property
    def llm_configured(self) -> bool:
        return bool(self.llm_base_url and self.llm_model)

    def update(self, **kwargs: Any) -> None:
        """Apply runtime overrides. Persists to disk automatically."""
        allowed = {f.name for f in fields(self) if not f.name.startswith("_")}
        changed = False
        for key, value in kwargs.items():
            if key in allowed and value is not None:
                setattr(self, key, value)
                changed = True
        if changed:
            with _LOCK:
                _save(self._persistable())

    def reset_to_env(self) -> None:
        """Discard all overrides and delete saved config."""
        for key, value in self._baseline.items():
            setattr(self, key, value)
        try:
            _CONFIG_FILE.unlink(missing_ok=True)
        except Exception:
            pass

    def as_dict(self, mask_key: bool = True) -> dict[str, Any]:
        """Safe serialization — masks API key unless it's the public Ollama default."""
        return {
            "llm_base_url": self.llm_base_url,
            "llm_model": self.llm_model,
            "llm_api_key": _mask(self.llm_api_key) if mask_key else self.llm_api_key,
            "llm_timeout": self.llm_timeout,
            "llm_temperature": self.llm_temperature,
        }

    def diff_from_env(self) -> dict[str, Any]:
        """Which fields currently differ from their env baseline?"""
        return {
            key: getattr(self, key)
            for key, base in self._baseline.items()
            if getattr(self, key) != base
        }

    def _persistable(self) -> dict[str, Any]:
        """Current values for all persistable fields (unmasked)."""
        return {k: getattr(self, k) for k in _PERSIST_KEYS}


def _mask(value: str) -> str:
    """Mask API key unless it's the Ollama sentinel."""
    if not value or value == "ollama":
        return value
    if len(value) <= 6:
        return "••••"
    return f"{value[:3]}••••{value[-3:]}"


settings = Settings()
