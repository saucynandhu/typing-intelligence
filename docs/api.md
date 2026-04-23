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
- `GET /api/insights/profile?userId=<id>`
  - Returns weak words and weak letter-sequence hotspots.
