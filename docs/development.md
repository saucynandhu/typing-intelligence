# Development Guide

## Setup
- Install dependencies with `npm install`.
- Configure `.env` from `.env.example`.
- Apply schema with `npm run prisma:migrate`.
- Seed base words with `npm run prisma:seed`.

## Day-to-day Commands
- `npm run dev`: start web app.
- `npm run lint`: run app linting.
- `npm run test`: run node tests.
- `npm run build`: production build check.

## Commit Order Per Phase
1. Schema and migration updates.
2. API/backend behavior.
3. Frontend UX.
4. Tests.
5. Docs.
