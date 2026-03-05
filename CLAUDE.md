# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**Hermeneus** — ORGANVM Stakeholder Intelligence Portal. A public, URL-accessible intelligence layer with full contextual awareness of every repo across the eight-organ system. Queryable by non-technical actors via natural language (OSS/free LLM chat).

## Build & Dev Commands

```bash
# Generate manifest from live workspace data (requires Python 3 + PyYAML)
python3 scripts/generate-manifest.py

# Dev server
npm run dev            # next dev (localhost:3000)

# Lint + tests
npm run lint           # eslint CLI (flat config)
npm run test           # vitest unit tests

# Build (prebuild regenerates manifest when sources are available)
npm run build          # generate-manifest.py --allow-stale-manifest && next build

# Start production server
npm start
```

## Architecture

```
[111 repos] → generate-manifest.py → manifest.json → Next.js 15 app → Vercel
               (Python, reads                         (static pages +
                registry, seeds,                       AI chat API route
                CLAUDE.md, git logs)                    using OSS LLM API)
```

### Three layers

1. **Data pipeline** (`scripts/generate-manifest.py`) — Reads registry-v2.json, seed.yaml files, CLAUDE.md/README.md, git logs, organ-aesthetic.yaml → produces `src/data/manifest.json`
2. **Static frontend** (Next.js 15 + Tailwind 4 + React 19) — Structured views: landing, repo browser, repo detail, organ pages, dashboard, about
3. **AI chat route** (`/api/chat`) — Server-side OSS/free model calls (Groq primary, OpenAI-compatible fallback) with two-tier retrieval for natural language queries

### Key files

| Path | Purpose |
|------|---------|
| `scripts/generate-manifest.py` | Data pipeline — produces manifest.json |
| `src/data/manifest.json` | Generated data snapshot (committed, refreshed intentionally) |
| `src/lib/types.ts` | TypeScript interfaces for manifest schema |
| `src/lib/manifest.ts` | Manifest loader + query helpers |
| `src/lib/retrieval.ts` | Two-tier context assembly for AI chat |
| `src/app/api/chat/route.ts` | OSS model streaming chat endpoint |
| `src/components/ChatInterface.tsx` | Chat UI with SSE streaming |

### Pages

- `/` — Landing: metrics, organ cards, deployments
- `/repos` — Filterable repo browser (all 103 repos)
- `/repos/[slug]` — Repo detail with sections, git stats, links
- `/organs` — Organ grid overview
- `/organs/[key]` — Organ detail with all repos
- `/dashboard` — Metrics, promotion pipeline, CI health, sprint history
- `/ask` — AI chat interface
- `/about` — Methodology and organ descriptions

## Environment

Copy `.env.example` → `.env`. Preferred path is Groq (`GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_API_URL`) with anonymous OSS fallback available via `OSS_LLM_API_URL` and `OSS_LLM_MODEL`.

## Conventions

- Node 20+, npm
- TypeScript strict mode
- Tailwind v4 (PostCSS plugin)
- Dark theme with CSS custom properties
- Conventional commits
