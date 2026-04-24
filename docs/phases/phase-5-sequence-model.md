# phase-5-sequence-model

## Outcome
Sequence modeling now computes smoothed bigram/trigram error likelihood and delay behavior with minimum support guards to reduce overfitting.

## Verification
- npm run lint
- npm run test
- npm run pipeline:run-all
- npm run pipeline:evaluate

## Notes
- Replaced corrupted sequence script with deterministic aggregation in `scripts/pipelines/update-sequence-model.js`.
- Profile API now exposes sequence confidence and trust thresholds.
