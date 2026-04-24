# Changelog

## v0.1.0
- Bootstrapped monorepo structure and Next.js web app.
- Added Prisma schema for sessions, events, features, and adaptive models.
- Implemented typing MVP, replay endpoint, and adaptive insight endpoints.
- Added phase documentation skeleton for all planned stages.

## v0.1.1
- Fixed Next.js path alias resolution by adding `baseUrl` and `@/*` mappings in the web TypeScript config.
- Unblocked local dev startup where `@/components/TypingTest` failed to resolve.

## v0.2.0
- Hardened model pipeline scripts with deterministic ordering, quality filters, and fixed runtime/syntax failures.
- Added deep-model pipeline orchestrator (`pipeline:run-all`) and offline evaluation runner (`pipeline:evaluate`).
- Upgraded personal, sequence, and global model behavior with confidence-aware diagnostics and cold-start fallback APIs.

## v0.3.0 (2026-04-24)
- **Phase 8 Completion**: Implemented real-time adaptive word selection logic (Recovery, Balanced, Challenge strategies).
- **UI/UX Overhaul**: 
  - Added Monkeytype-style time-limited modes (15s, 30s, 60s).
  - Implemented minimalist design with custom blinking cursor and responsive layouts.
  - Refined global CSS variables for consistent dark mode experience.
- **Metrics Engine**:
  - Fixed WPM/Accuracy calculation logic using `net WPM` (correct characters only).
  - Resolved stale closure issues in session finalization using React refs.
- **Pipeline Automation**:
  - Background intelligence pipeline now triggers automatically on session completion.
  - Fixed environment variable loading issues in CLI scripts.
- **Data Integrity**:
  - Implemented `userId` persistence across sessions.
  - Backfilled historical session data to enable immediate model personalization.
