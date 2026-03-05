# Stakeholder Portal

Public intelligence interface for ORGANVM repositories and system metadata.

## Local Development

```bash
npm install
npm run dev
```

## Quality Gates

```bash
npm run lint
npm run test
npm run build
```

## Manifest Data Policy

- `src/data/manifest.json` is a committed snapshot.
- `npm run generate` refreshes the snapshot from workspace sources.
- `npm run build` runs `generate-manifest.py --allow-stale-manifest`:
  - regenerates when source registry files are available
  - keeps existing snapshot when running in isolated CI environments

## CI

GitHub Actions workflow at `.github/workflows/ci.yml` runs:

1. `npm run lint`
2. `npm run test`
3. `npm run build`
