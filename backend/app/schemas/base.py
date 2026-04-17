"""Shared types for all tier schemas."""
from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class Tier(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    EXPERT = "expert"


class TechStack(BaseModel):
    language: str = Field(..., description="Primary language, e.g. 'Python', 'TypeScript'")
    framework: str | None = Field(None, description="Primary framework, e.g. 'FastAPI', 'Next.js'")
    database: str | None = Field(None, description="Database, e.g. 'PostgreSQL'")
    extras: list[str] = Field(default_factory=list, description="Other key tools/libs")


class Convention(BaseModel):
    rule: str = Field(..., description="The rule itself, imperative voice")
    rationale: str | None = Field(None, description="Why this rule exists")


class Command(BaseModel):
    name: str = Field(..., description="Slash command name without the slash")
    description: str = Field(..., description="One-line description")
    body: str = Field(..., description="Prompt body, may use $ARGUMENTS")
    allowed_tools: list[str] | None = Field(
        None,
        description="Optional: restrict which tools this command is allowed to invoke",
    )
