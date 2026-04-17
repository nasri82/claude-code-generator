"""Intermediate tier input schema — CLAUDE.md + commands + settings."""
from __future__ import annotations

from pydantic import BaseModel, Field

from .base import Command, Convention, TechStack


class Architecture(BaseModel):
    summary: str = Field(..., description="Short architecture overview (2-5 sentences)")
    key_directories: dict[str, str] = Field(
        default_factory=dict,
        description="Map of directory -> what lives there",
    )


class IntermediateInput(BaseModel):
    project_name: str = Field(..., min_length=1, max_length=80)
    one_liner: str = Field(..., min_length=1, max_length=200)
    tech_stack: TechStack
    architecture: Architecture
    run_command: str
    test_command: str | None = None
    conventions: list[Convention] = Field(default_factory=list, max_length=15)
    commands: list[Command] = Field(default_factory=list, max_length=5)
    allowed_tools: list[str] = Field(
        default_factory=lambda: ["Read", "Edit", "Bash", "Glob", "Grep"],
        description="Tools Claude Code is allowed to use",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "project_name": "todo-api",
                "one_liner": "REST API for managing todos.",
                "tech_stack": {
                    "language": "Python",
                    "framework": "FastAPI",
                    "database": "PostgreSQL",
                    "extras": ["pytest", "alembic"],
                },
                "architecture": {
                    "summary": "Clean architecture with routes, services, and repositories.",
                    "key_directories": {
                        "app/routes": "HTTP endpoints",
                        "app/services": "Business logic",
                        "app/repositories": "Data access",
                    },
                },
                "run_command": "uvicorn app.main:app --reload",
                "test_command": "pytest",
                "conventions": [
                    {"rule": "Use type hints everywhere"},
                    {"rule": "No raw SQL outside repositories"},
                ],
                "commands": [
                    {
                        "name": "review",
                        "description": "Review recent changes for quality",
                        "body": "Review the staged diff for bugs, style, and missing tests. Be specific.",
                    }
                ],
            }
        }
    }
