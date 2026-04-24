# phase-6-global-model

## Outcome
Global similarity now stores normalized and reduced user embeddings and supports cold-start adaptive word fallback from nearest users.

## Verification
- npm run lint
- npm run test
- npm run pipeline:run-all
- npm run pipeline:evaluate

## Notes
- Added embedding normalization + 2D reduction in `scripts/pipelines/update-global-model.js`.
- Added similar-user fallback path in `apps/web/app/api/adaptive/next-words/route.ts`.
