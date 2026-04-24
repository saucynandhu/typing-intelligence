# phase-4-personal-model

## Outcome
Personal scoring now uses explicit EMA + time decay and persists calibrated `difficultyScore` values per word. The profile API surfaces per-word diagnostics and confidence.

## Verification
- npm run lint
- npm run test
- npm run pipeline:run-all
- npm run pipeline:evaluate

## Notes
- Added decay-aware score updates in `scripts/pipelines/update-personal-model.js`.
- Added confidence/component diagnostics in `apps/web/app/api/insights/profile/route.ts`.
