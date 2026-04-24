# Architecture

## Core Layers
- `apps/web`: Next.js UI and API endpoints for sessions, replay, adaptive word selection, and profile insights.
- `prisma`: canonical data model for raw events, derived features, and adaptive models.
- `scripts`: seed and batch processing entry points.
- `docs`: operational and phase documentation.

## Data Flow
1. User starts a session (`/api/session/start`) and receives prompt words.
2. Frontend captures keystrokes and sends batched events (`/api/session/events`).
3. Session finalization writes summary metrics (`/api/session/finish`).
4. Offline/nearline jobs compute features and model updates through a deterministic pipeline order:
   - `extract-features.js`
   - `update-personal-model.js`
   - `update-sequence-model.js`
   - `update-global-model.js`
   - `update-bandit-state.js`
5. Adaptive APIs provide next words and profile insights with confidence-aware fallbacks.

## Model Lineage
- `SessionFeature.bigramLatencyJson` stores run metadata (`modelVersion`, `computedAt`, `sourceWindow`) plus per-word hesitation and bigram latency distributions.
- `UserEmbedding.vector` stores raw, normalized, and reduced vectors with run metadata.
- Sequence model applies Bayesian smoothing and minimum-support thresholds before persistence.

## Scalability Path
- Optional websocket ingestion and Redis-backed active sessions in Phase 10.
- Separate online scoring (request path) from offline batch feature/model recomputation.
