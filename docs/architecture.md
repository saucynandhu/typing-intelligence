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
4. Offline/nearline jobs compute features and model updates.
5. Adaptive APIs provide next words and profile insights.

## Scalability Path
- Optional websocket ingestion and Redis-backed active sessions in Phase 10.
- Separate online scoring (request path) from offline batch feature/model recomputation.
