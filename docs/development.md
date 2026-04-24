# Development Guide

## Setup
- Install dependencies with `npm install`.
- Configure `.env` from `.env.example`.
- Apply schema with `npm run prisma:migrate` (or `npx prisma db push` on pooled managed Postgres).
- Seed base words with `npm run prisma:seed`.

## Day-to-day Commands
- `npm run dev`: start web app.
- `npm run lint`: run app linting.
- `npm run test`: run node tests.
- `npm run build`: production build check.
- `npm run pipeline:run-all`: run deterministic extraction/model pipeline.
- `npm run pipeline:evaluate`: compute offline model quality report.

## Import Alias
- The web app uses `@/*` imports mapped in `apps/web/tsconfig.json`.
- If module resolution fails for `@/` paths, confirm `baseUrl` is `.` and `paths` includes `"@/*": ["./*"]`.

## Commit Order Per Phase
1. Schema and migration updates.
2. API/backend behavior.
3. Frontend UX.
4. Tests.
5. Docs.
