# Backend — Claude Scaffolder API

FastAPI service that renders Jinja templates per tier and returns downloadable ZIPs.

## Run

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for interactive API docs.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/preview/{tier}` | Render templates → JSON `{files: [...]}` for live preview |
| POST | `/api/generate/{tier}` | Render templates → ZIP attachment |
| GET | `/health` | Healthcheck |

Tiers: `beginner`, `intermediate`, `expert`.

## Architecture

```
app/
├── main.py              # FastAPI app + CORS
├── routes/              # /api/generate and /api/preview
├── schemas/             # Pydantic v2 input models per tier
├── services/
│   ├── renderer.py      # Jinja env + render()
│   └── packager.py      # build_{tier}() + make_zip()
└── templates/
    ├── beginner/        # CLAUDE.md.j2
    ├── intermediate/    # CLAUDE.md + settings + commands
    └── expert/          # Everything above + skills + agents + hooks + MCP + MEMORY.md
```

## Extending

- **New field on a tier** → add to `schemas/{tier}.py` and reference in the matching `.j2` template.
- **New tier file** → add a `.j2` template and a line in `services/packager.py::build_{tier}()`.
- **New tier entirely** → add schema, templates directory, builder function, and routes.

All templates use `StrictUndefined` — missing context keys fail loudly at render time rather than producing silently wrong output.
