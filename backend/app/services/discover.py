"""Aggregate Claude/MCP ecosystem items from GitHub, Smithery, Glama, and npm."""
from __future__ import annotations

import asyncio
import hashlib
import logging
import os
import time
from typing import Any

import httpx

log = logging.getLogger(__name__)

_TTL = 3600
_CACHE: dict[str, tuple[float, list[dict[str, Any]]]] = {}
_TIMEOUT = httpx.Timeout(15.0)

_GH_TOKEN = os.getenv("GITHUB_TOKEN", "")
_GH_HEADERS: dict[str, str] = {"Accept": "application/vnd.github+json"}
if _GH_TOKEN:
    _GH_HEADERS["Authorization"] = f"Bearer {_GH_TOKEN}"


def cache_age() -> float | None:
    if "all" in _CACHE:
        return time.time() - _CACHE["all"][0]
    return None


def _get_cached() -> list[dict[str, Any]] | None:
    if "all" in _CACHE:
        ts, data = _CACHE["all"]
        if time.time() - ts < _TTL:
            return data
    return None


def _set_cached(data: list[dict[str, Any]]) -> None:
    _CACHE["all"] = (time.time(), data)


def _norm_repo_url(url: str | None) -> str | None:
    if not url:
        return None
    url = str(url).rstrip("/").lower()
    if url.endswith(".git"):
        url = url[:-4]
    for prefix in ("https://", "http://"):
        if url.startswith(prefix):
            url = url[len(prefix):]
            break
    return url


def _make_id(*parts: str) -> str:
    return hashlib.md5("|".join(p.lower() for p in parts).encode()).hexdigest()[:12]


def _infer_category(name: str, description: str, topics: list[str]) -> str:
    text = f"{name} {description} {' '.join(topics)}".lower()
    if any(t in ["mcp-server", "model-context-protocol", "mcp"] for t in topics):
        return "mcp-server"
    if "mcp" in text and any(w in text for w in ["server", "tool", "protocol"]):
        return "mcp-server"
    if "skill" in text and "claude" in text:
        return "skill"
    if "agent" in text and ("claude" in text or "subagent" in text):
        return "agent"
    if any(w in text for w in ["template", "scaffold", "boilerplate", "starter"]):
        return "template"
    if any(w in text for w in ["sdk", "client", "wrapper", "library", "binding"]):
        return "sdk"
    return "tool"


async def _fetch_github(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    queries = [
        "topic:mcp-server",
        "topic:claude-code",
        "org:modelcontextprotocol",
    ]
    seen_ids: set[str] = set()
    items: list[dict[str, Any]] = []

    for q in queries:
        try:
            resp = await client.get(
                "https://api.github.com/search/repositories",
                params={"q": q, "sort": "stars", "order": "desc", "per_page": 50},
                headers=_GH_HEADERS,
                timeout=_TIMEOUT,
            )
            resp.raise_for_status()
            for repo in resp.json().get("items", []):
                rid = str(repo.get("id", ""))
                if rid in seen_ids:
                    continue
                seen_ids.add(rid)
                owner_login = repo.get("owner", {}).get("login", "")
                is_official = owner_login in ("modelcontextprotocol", "anthropics", "anthropic")
                category = _infer_category(
                    repo.get("name", ""),
                    repo.get("description") or "",
                    repo.get("topics") or [],
                )
                items.append({
                    "id": _make_id("github", rid),
                    "name": repo.get("full_name", repo.get("name", "")),
                    "description": repo.get("description") or "",
                    "url": repo.get("html_url", ""),
                    "repo_url": _norm_repo_url(repo.get("html_url")),
                    "stars": repo.get("stargazers_count"),
                    "downloads": None,
                    "category": category,
                    "sources": ["github"],
                    "language": repo.get("language"),
                    "updated_at": repo.get("pushed_at"),
                    "install": None,
                    "author": owner_login or None,
                    "is_official": is_official,
                })
        except Exception as exc:
            log.warning("GitHub search %r failed: %s", q, exc)

    return items


async def _fetch_smithery(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    try:
        resp = await client.get(
            "https://registry.smithery.ai/servers",
            params={"q": "", "pageSize": 100, "currentPage": 1},
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        servers = resp.json().get("servers", [])
        items = []
        for s in servers:
            name = s.get("displayName") or s.get("qualifiedName") or ""
            desc = s.get("description") or ""
            homepage = s.get("homepage") or ""
            qn = s.get("qualifiedName") or ""
            repo_url = None
            if homepage and "github.com" in homepage:
                repo_url = _norm_repo_url(homepage)
            elif "/" in qn:
                repo_url = _norm_repo_url(f"github.com/{qn}")
            items.append({
                "id": _make_id("smithery", qn or name),
                "name": name,
                "description": desc,
                "url": homepage or f"https://smithery.ai/server/{qn}",
                "repo_url": repo_url,
                "stars": None,
                "downloads": s.get("useCount"),
                "category": "mcp-server",
                "sources": ["smithery"],
                "language": None,
                "updated_at": s.get("createdAt"),
                "install": (f"npx @smithery/cli install {qn}" if qn else None),
                "author": qn.split("/")[0] if "/" in qn else None,
                "is_official": False,
            })
        return items
    except Exception as exc:
        log.warning("Smithery fetch failed: %s", exc)
        return []


async def _fetch_glama(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    try:
        resp = await client.get(
            "https://glama.ai/api/mcp/v1/servers",
            params={"first": 100},
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        servers = (
            data.get("data")
            or data.get("servers")
            or (data if isinstance(data, list) else [])
        )
        items = []
        for s in servers:
            name = s.get("name") or s.get("title") or s.get("displayName") or ""
            desc = s.get("description") or s.get("summary") or ""
            gh = (
                s.get("githubUrl")
                or s.get("repositoryUrl")
                or s.get("repository")
                or ""
            )
            url = s.get("url") or s.get("homepage") or gh or ""
            items.append({
                "id": _make_id("glama", str(s.get("id", name))),
                "name": name,
                "description": desc,
                "url": url,
                "repo_url": _norm_repo_url(gh or None),
                "stars": s.get("stars") or s.get("stargazers"),
                "downloads": None,
                "category": "mcp-server",
                "sources": ["glama"],
                "language": s.get("language"),
                "updated_at": s.get("updatedAt") or s.get("pushedAt"),
                "install": None,
                "author": s.get("author") or s.get("owner"),
                "is_official": False,
            })
        return items
    except Exception as exc:
        log.warning("Glama fetch failed: %s", exc)
        return []


async def _fetch_npm(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    queries = ["@modelcontextprotocol", "mcp server claude"]
    seen: set[str] = set()
    items: list[dict[str, Any]] = []
    for q in queries:
        try:
            resp = await client.get(
                "https://registry.npmjs.org/-/v1/search",
                params={"text": q, "size": 50},
                timeout=_TIMEOUT,
            )
            resp.raise_for_status()
            for obj in resp.json().get("objects", []):
                pkg = obj.get("package", {})
                pname = pkg.get("name", "")
                if not pname or pname in seen:
                    continue
                seen.add(pname)
                links = pkg.get("links", {})
                repo_url = _norm_repo_url(
                    links.get("repository") or links.get("source")
                )
                category = _infer_category(pname, pkg.get("description") or "", [])
                is_official = pname.startswith("@modelcontextprotocol/") or pname.startswith("@anthropic")
                items.append({
                    "id": _make_id("npm", pname),
                    "name": pname,
                    "description": pkg.get("description") or "",
                    "url": links.get("npm") or f"https://www.npmjs.com/package/{pname}",
                    "repo_url": repo_url,
                    "stars": None,
                    "downloads": None,
                    "category": category,
                    "sources": ["npm"],
                    "language": "TypeScript",
                    "updated_at": pkg.get("date"),
                    "install": f"npm install {pname}",
                    "author": pkg.get("publisher", {}).get("username"),
                    "is_official": is_official,
                })
        except Exception as exc:
            log.warning("npm search %r failed: %s", q, exc)
    return items


def _deduplicate(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_repo: dict[str, dict[str, Any]] = {}
    no_repo: list[dict[str, Any]] = []

    for item in items:
        repo_url = item.get("repo_url")
        if not repo_url:
            no_repo.append(item)
            continue
        if repo_url in by_repo:
            ex = by_repo[repo_url]
            ex["sources"] = sorted(set(ex["sources"]) | set(item["sources"]))
            if not ex["stars"] and item.get("stars"):
                ex["stars"] = item["stars"]
            if not ex["description"] and item.get("description"):
                ex["description"] = item["description"]
            if item.get("is_official"):
                ex["is_official"] = True
            if not ex["install"] and item.get("install"):
                ex["install"] = item["install"]
            if not ex["downloads"] and item.get("downloads"):
                ex["downloads"] = item["downloads"]
            if not ex["language"] and item.get("language"):
                ex["language"] = item["language"]
        else:
            by_repo[repo_url] = dict(item)

    merged = list(by_repo.values()) + no_repo
    merged.sort(
        key=lambda x: (
            not x.get("is_official", False),
            -(x.get("stars") or 0),
            -(x.get("downloads") or 0),
        )
    )
    return merged


async def fetch_all(force: bool = False) -> list[dict[str, Any]]:
    if not force:
        cached = _get_cached()
        if cached is not None:
            return cached

    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(
            _fetch_github(client),
            _fetch_smithery(client),
            _fetch_glama(client),
            _fetch_npm(client),
            return_exceptions=True,
        )

    all_items: list[dict[str, Any]] = []
    for r in results:
        if isinstance(r, list):
            all_items.extend(r)
        else:
            log.warning("Source fetch exception: %s", r)

    merged = _deduplicate(all_items)
    _set_cached(merged)
    return merged
