# 2026-03-06: Omniscience Vector Pipeline Activation

**Status:** EXECUTED
**Duration:** ~2.5 hours (code changes: 20 min, ingestion: ongoing)
**Cost:** $0.00

## What was done
1. Created Neon DB project (`small-fog-61557376`) with pgvector
2. Changed vector dimensions 1536 → 384 (schema + migration)
3. Adapted `fetchEmbedding()` in ingest-worker.ts for HuggingFace API format
4. Adapted Strategy 4 in hybrid-retrieval.ts for HuggingFace API format
5. Updated .env.local with real Neon + HF credentials
6. Set Vercel env vars (production + development)
7. Ran DB migrations (all 3 applied to fresh DB)
8. Started ingestion (27K+ chunks, 10+ repos as of session end)
9. All 220 tests pass, build succeeds

## What was derived
- SOP-001: Vector Pipeline Activation (generalized for any ORGANVM project)
- Session memory file for future sessions
- Anti-patterns and lessons learned documented in SOP

## Files changed
- `src/lib/db/schema.ts` — vector(1536) → vector(384)
- `src/lib/ingestion/ingest-worker.ts` — HF API support in fetchEmbedding()
- `src/lib/hybrid-retrieval.ts` — HF API support in Strategy 4
- `.env.local` — real credentials
- `CLAUDE.md` — dimension doc update
- `src/lib/db/migrations/0003_abandoned_brother_voodoo.sql` — generated

## Remaining
- Ingestion completing in background
- `vercel deploy --prod` after ingestion
- Preview env vars (manual)
