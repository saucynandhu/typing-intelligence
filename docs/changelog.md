# Changelog

## v0.1.0
- Bootstrapped monorepo structure and Next.js web app.
- Added Prisma schema for sessions, events, features, and adaptive models.
- Implemented typing MVP, replay endpoint, and adaptive insight endpoints.
- Added phase documentation skeleton for all planned stages.

## v0.1.1
- Fixed Next.js path alias resolution by adding `baseUrl` and `@/*` mappings in the web TypeScript config.
- Unblocked local dev startup where `@/components/TypingTest` failed to resolve.
