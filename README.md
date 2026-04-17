# Claude Scaffolder

Generate production-ready Claude Code project scaffolds — `CLAUDE.md`, skills, slash commands, subagents, hooks, MCP configs, and `MEMORY.md` — from a web form, with optional LLM assistance.

Three tiers cover the full range from "just starting with Claude Code" to "running a multi-agent system with cross-cutting rules." A local LLM (Ollama by default) can fill the entire form from a one-paragraph description, suggest content for individual fields, or review your finished scaffold for gaps.

---

## Quick Start

### 1. Set up the LLM (optional but recommended)

The scaffolder works without an LLM — forms fill the templates directly. Hook up a local model for the magic.

**Ollama (recommended):**
```bash
# Install Ollama: https://ollama.com
ollama pull qwen2.5-coder:14b   # or another model you prefer
ollama serve                     # usually runs as a service already
```

**Any OpenAI-compatible endpoint works:** LM Studio, vLLM, llama.cpp server, or the OpenAI API itself. Set `LLM_BASE_URL` and `LLM_MODEL` in `.env`.

### 2. Copy environment template

```bash
cp .env.example .env
# Edit .env to match your setup (model name, base URL, etc.)
```

### 3. Run

**Option A — Docker (recommended):**
```bash
docker compose up --build
```

**Option B — Local:**
```bash
# Terminal 1 — backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

Backend docs: http://localhost:8000/docs
LLM health check: http://localhost:8000/api/ai/health

---

## Tiers

| Tier | Generates | Use when |
|------|-----------|----------|
| **Beginner** | `CLAUDE.md` | New project, basic context for Claude Code |
| **Intermediate** | + `.claude/settings.json` + slash commands | Established project with patterns worth capturing |
| **Expert** | + `MEMORY.md` + skills + agents + hooks + `.mcp.json` | Production system with cross-cutting rules, multi-agent flows |

---

## LLM Features

### 1. Bootstrap from description (all tiers)

Expand the **✨ Describe your project** card above any tier's form. Type a paragraph describing your project. The LLM produces a fully-filled form matching the tier's schema. Review, edit, preview, download.

> *"Multi-tenant SaaS for insurance TPAs in Lebanon. FastAPI + Next.js, PostgreSQL with RLS, Celery for async policy-issuance workflows. Needs strict audit logging."*
>
> → Expert form with 6 cross-cutting rules across Security/Multi-tenancy/Observability, a sensible `MEMORY.md`, 3 slash commands, and an `audit-review` agent.

### 2. Field-level assist (expert tier)

Inline **✨ Assist** buttons populate specific heavyweight fields:
- Skill **body** from just a name + trigger description
- Agent **system prompt** from just a role
- **Cross-cutting rules** suggested from your tech stack
- Slash command **body** from just a name + description

### 3. Post-generation review (expert tier)

Click **✨ Review scaffold** under the form. The LLM reads all generated files and returns structured findings categorized as `missing`, `vague`, `risky`, or `praise`, each with a specific location and suggested fix.

### LLM Networking Notes

| Your setup | `LLM_BASE_URL` |
|------------|----------------|
| Docker on Windows/Mac, Ollama on host | `http://host.docker.internal:11434/v1` |
| Docker on Linux, Ollama on host | Use host LAN IP, or run with `--network=host` |
| Backend local (uvicorn), Ollama on same machine | `http://localhost:11434/v1` |

The `docker-compose.yml` already sets `host.docker.internal` as the default. Override via `.env` if needed.

---

## Architecture

```
claude-scaffolder/
├── backend/                    # FastAPI
│   ├── app/
│   │   ├── main.py             # App + CORS + routes
│   │   ├── config.py           # LLM env config
│   │   ├── routes/
│   │   │   ├── generate.py     # POST /api/generate/{tier} → ZIP
│   │   │   ├── preview.py      # POST /api/preview/{tier}  → JSON
│   │   │   └── ai.py           # POST /api/ai/{bootstrap,assist,review}
│   │   ├── schemas/            # Pydantic v2 per tier
│   │   ├── services/
│   │   │   ├── renderer.py     # Scaffold Jinja env
│   │   │   ├── packager.py     # build_{tier}() → ZIP
│   │   │   ├── prompts.py      # Prompt-template Jinja env
│   │   │   └── llm.py          # OpenAI-compat client (httpx)
│   │   ├── templates/          # Output templates per tier
│   │   │   ├── beginner/
│   │   │   ├── intermediate/
│   │   │   └── expert/
│   │   └── prompts/            # LLM prompt templates
│   │       ├── bootstrap.md.j2
│   │       ├── assist_*.md.j2
│   │       └── review.md.j2
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # Next.js 14 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Tier selector
│   │   │   ├── beginner/
│   │   │   ├── intermediate/
│   │   │   └── expert/
│   │   ├── components/
│   │   │   ├── PreviewPanel.tsx
│   │   │   ├── FieldArray.tsx
│   │   │   ├── BootstrapCard.tsx   # ✨ describe-your-project card
│   │   │   ├── AssistButton.tsx    # ✨ inline field assist
│   │   │   └── ReviewPanel.tsx     # ✨ post-gen review
│   │   └── lib/
│   │       ├── schemas.ts      # Zod mirror of Pydantic
│   │       ├── api.ts          # preview + generate
│   │       └── ai.ts           # bootstrap + assist + review
│   ├── package.json
│   └── Dockerfile
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## Design Decisions

**OpenAI-compatible API, not Ollama-native.** The backend speaks `/v1/chat/completions`. Lets you swap Ollama for LM Studio, vLLM, or cloud without touching code.

**JSON mode with retry.** Bootstrap and cross-cutting-rules assist use `response_format: { type: "json_object" }`. On parse failure, one automatic retry with an explicit correction prompt. Still fails? Frontend shows the raw LLM output so you can see what went wrong.

**Pydantic validation of LLM output.** Every bootstrap response is validated against the same `ExpertInput`/`IntermediateInput`/`BeginnerInput` schema used by the form. Invalid output → 422 with structured error.

**Preview = Generate.** Both use the same `packager.build_{tier}()` code path. What you see in the preview panel is exactly what ends up in the ZIP.

**Strict templates.** Jinja `StrictUndefined` — missing context keys raise at render time rather than silently producing wrong output.

**Prompts as templates, not hardcoded strings.** All LLM prompts live in `backend/app/prompts/` as Jinja files. Iterate without touching Python.

---

## Extending

### Add a new field to an existing tier
1. Add to `backend/app/schemas/{tier}.py`
2. Reference in the matching `.j2` template
3. Mirror in `frontend/src/lib/schemas.ts`
4. Add form input in `frontend/src/app/{tier}/page.tsx`

### Add a new AI assist kind
1. Add a prompt template in `backend/app/prompts/assist_{kind}.md.j2`
2. Add the kind to the `Literal` in `routes/ai.py::AssistRequest`
3. Add the handler branch in `routes/ai.py::assist`
4. Wire an `<AssistButton kind="..." context={...} />` next to the target field

### Swap out the LLM
Just change `LLM_BASE_URL` and `LLM_MODEL` in `.env`. No code change required as long as the endpoint is OpenAI-compatible.

---

## Troubleshooting

**"Could not reach LLM at ..."**
Check the output of `GET /api/ai/health`. Then confirm Ollama is running (`curl localhost:11434/api/tags`). If running inside Docker, make sure `LLM_BASE_URL` uses `host.docker.internal`, not `localhost`.

**"LLM output did not match the tier schema"**
The model returned JSON but it was structurally wrong. The error response includes the raw output. Try a stronger model (e.g. `qwen2.5-coder:14b` over `llama3.1:8b`), or lower temperature.

**Form empty after bootstrap**
The bootstrap response populated the form via `form.reset()`. Click **Preview** to render — the panel fills only on explicit preview to avoid spamming the backend.
