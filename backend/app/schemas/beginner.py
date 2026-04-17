"""Beginner tier input schema — minimal, single CLAUDE.md."""
from __future__ import annotations

from pydantic import BaseModel, Field

from .base import Convention, TechStack


class BeginnerInput(BaseModel):
    project_name: str = Field(..., min_length=1, max_length=80)
    one_liner: str = Field(..., min_length=1, max_length=200, description="One-line project description")
    tech_stack: TechStack
    run_command: str = Field(..., description="How to run the project locally")
    conventions: list[Convention] = Field(default_factory=list, max_length=10)

    model_config = {
        "json_schema_extra": {
            "example": {
                "project_name": "todo-api",
                "one_liner": "A small REST API for managing todos.",
                "tech_stack": {
                    "language": "Python",
                    "framework": "FastAPI",
                    "database": "SQLite",
                    "extras": ["pytest"],
                },
                "run_command": "uvicorn app.main:app --reload",
                "conventions": [
                    {"rule": "Use type hints everywhere", "rationale": "Enables static analysis"},
                    {"rule": "One route per file under app/routes/"},
                ],
            }
        }
    }
