"""FastAPI application entry point."""
from __future__ import annotations

import logging
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .routes import ai, catalog, config, discover, generate, presets, preview, whatsnew

# Structured logging so we can actually see what's happening
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
)
log = logging.getLogger("claude-scaffolder")

# Bump this whenever you change the backend so you can verify
# a live instance by hitting GET / and checking build_id.
BUILD_ID = "2026-04-16-whatsnew-v2"

app = FastAPI(
    title="Claude Scaffolder API",
    description="Generates CLAUDE.md, skills, commands, agents, hooks, and MCP configs per tier.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global safety net: any exception that escapes a route handler lands here
# with a structured JSON body instead of bare "Internal Server Error".
@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    tb = traceback.format_exc()
    log.error("Unhandled exception on %s %s\n%s", request.method, request.url.path, tb)
    return JSONResponse(
        status_code=500,
        content={
            "detail": {
                "error": f"{type(exc).__name__}: {exc}",
                "path": request.url.path,
                "hint": "Full traceback is in the backend terminal.",
            }
        },
    )


app.include_router(generate.router)
app.include_router(preview.router)
app.include_router(ai.router)
app.include_router(config.router)
app.include_router(whatsnew.router)
app.include_router(presets.router)
app.include_router(catalog.router)
app.include_router(discover.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "build_id": BUILD_ID}


@app.get("/")
async def root() -> dict:
    return {
        "name": "claude-scaffolder",
        "build_id": BUILD_ID,
        "endpoints": {
            "generate": ["/api/generate/beginner", "/api/generate/intermediate", "/api/generate/expert"],
            "preview": ["/api/preview/beginner", "/api/preview/intermediate", "/api/preview/expert"],
            "ai": ["/api/ai/health", "/api/ai/bootstrap/{tier}", "/api/ai/assist", "/api/ai/review"],
            "config": ["/api/config/llm", "/api/config/llm/test", "/api/config/llm/models", "/api/config/llm/reset"],
            "whatsnew": ["/api/whatsnew", "/api/whatsnew/classify", "/api/whatsnew/apply"],
            "presets": ["/api/presets", "/api/presets/{id}"],
            "catalog": ["/api/catalog"],
            "docs": "/docs",
        },
    }
