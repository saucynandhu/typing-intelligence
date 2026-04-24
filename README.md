# Typing Intelligence

Typing Intelligence is a staged typing platform that starts as an MVP typing test and grows into an adaptive training system with replay, feature extraction, personalized models, and real-time adaptation.

## Stack
- Next.js + TypeScript
- PostgreSQL + Prisma
- Node scripts for feature/model pipelines

## Quick Start
1. `npm install`
2. `cp .env.example .env` and set `DATABASE_URL`
3. `npm run prisma:generate`
4. `npm run prisma:migrate` (or `npx prisma db push` for pooled cloud setups)
5. `npm run prisma:seed`
6. `npm run pipeline:run-all` (optional deep-model refresh)
7. `npm run dev`

## Documentation
- `docs/architecture.md`
- `docs/development.md`
- `docs/api.md`
- `docs/changelog.md`
- `docs/phases/`
