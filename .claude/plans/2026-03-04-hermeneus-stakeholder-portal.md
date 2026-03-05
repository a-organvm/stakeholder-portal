# Hermeneus: Stakeholder Intelligence Portal — Implementation Plan

**Date**: 2026-03-04
**Status**: IMPLEMENTED

## Summary

Built the ORGANVM Stakeholder Intelligence Portal at `meta-organvm/stakeholder-portal/`.

## What was built

1. **Data pipeline** (`scripts/generate-manifest.py`) — Python script that reads registry-v2.json, seed.yaml, CLAUDE.md, README.md, git logs, organ-aesthetic.yaml and produces manifest.json (103 repos, 43 dep edges, 20 deployments)

2. **Next.js 15 app** with Tailwind v4, React 19:
   - Landing page with metrics, organ cards, deployments
   - Repo browser with search, filter (organ/tier/promotion), sort
   - 103 repo detail pages (static generated)
   - 8 organ detail pages
   - Dashboard with promotion pipeline, CI health, sprint history, top repos
   - About page with methodology
   - AI chat interface at /ask

3. **AI chat API route** (`/api/chat`) — Claude Sonnet 4.6 with two-tier retrieval:
   - Tier 1: always-included system summary (~2K tokens)
   - Tier 2: query-relevant repos scored by keyword matching
   - SSE streaming, 10 req/min rate limiting

4. **Ecosystem registration**: seed.yaml, CLAUDE.md

## Build verification

- `python3 scripts/generate-manifest.py` — 103 repos, 43 dep edges, 20 deployments
- `npm run build` — 114 pages generated, clean build
- 30 files total (excluding node_modules, .next)
