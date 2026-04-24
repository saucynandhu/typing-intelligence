# API Reference

## Session Endpoints
- `POST /api/session/start`
  - Creates a typing session and returns `sessionId` + prompt words.
- `POST /api/session/events`
  - Accepts keystroke event batches with timing and correctness metadata.
- `POST /api/session/finish`
  - Stores final session metrics: WPM, accuracy, duration.
- `GET /api/session/replay/:sessionId`
  - Returns full session and ordered events for reconstruction.

## Adaptive Endpoints
- `GET /api/adaptive/next-words?userId=<id>`
  - Returns targeted words ranked by personalized difficulty.
  - Includes diagnostics for top candidates (`difficulty`, `confidence`) when personal skill data exists.
  - Uses cold-start fallback:
    - similar-user bootstrap when embeddings are available
    - default seed list when no embedding is available
- `GET /api/insights/profile?userId=<id>`
  - Returns weak words with diagnostics (`difficultyScore`, component penalties, confidence).
  - Returns sequence hotspots with confidence and threshold metadata.
