"""Expert tier input schema — full agentic scaffold."""
from __future__ import annotations

from pydantic import BaseModel, Field

from .base import Command, Convention, TechStack
from .intermediate import Architecture


class CrossCuttingRule(BaseModel):
    category: str = Field(..., description="e.g. 'Security', 'Multi-tenancy', 'Observability'")
    rule: str = Field(..., description="The rule, imperative voice")
    rationale: str | None = None


class Skill(BaseModel):
    name: str = Field(..., pattern=r"^[a-z0-9-]+$", description="kebab-case skill name")
    description: str = Field(
        ...,
        min_length=20,
        max_length=500,
        description="Trigger description — when Claude should invoke this skill",
    )
    body: str = Field(..., description="The skill's procedural content")


class Agent(BaseModel):
    name: str = Field(..., pattern=r"^[a-z0-9-]+$")
    description: str = Field(..., description="When to delegate to this agent")
    tools: list[str] = Field(default_factory=list, description="Tools this agent may use (empty = all)")
    model: str | None = Field(
        None,
        description="Optional model override, e.g. 'sonnet' or 'haiku'",
    )
    system_prompt: str = Field(..., description="The agent's system prompt / role")


class Hook(BaseModel):
    event: str = Field(..., description="e.g. 'PreToolUse', 'PostToolUse', 'UserPromptSubmit'")
    matcher: str | None = Field(None, description="Tool name pattern to match")
    command: str = Field(..., description="Shell command to run")


class MCPServer(BaseModel):
    name: str = Field(..., pattern=r"^[a-z0-9_-]+$")
    type: str = Field("stdio", description="stdio | http | sse")
    command: str | None = None
    args: list[str] = Field(default_factory=list)
    url: str | None = None
    env: dict[str, str] = Field(default_factory=dict)


class ExpertInput(BaseModel):
    project_name: str = Field(..., min_length=1, max_length=80)
    one_liner: str = Field(..., min_length=1, max_length=200)
    tech_stack: TechStack
    architecture: Architecture
    run_command: str
    test_command: str | None = None
    build_command: str | None = None

    conventions: list[Convention] = Field(default_factory=list)
    cross_cutting_rules: list[CrossCuttingRule] = Field(default_factory=list)

    commands: list[Command] = Field(default_factory=list)
    skills: list[Skill] = Field(default_factory=list)
    agents: list[Agent] = Field(default_factory=list)
    hooks: list[Hook] = Field(default_factory=list)
    mcp_servers: list[MCPServer] = Field(default_factory=list)

    include_memory_md: bool = Field(True, description="Include MEMORY.md session-handoff template")
    allowed_tools: list[str] = Field(
        default_factory=lambda: ["Read", "Edit", "Write", "Bash", "Glob", "Grep", "WebFetch"],
    )
    denied_tools: list[str] = Field(default_factory=list)
