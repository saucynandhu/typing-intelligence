# phase-8-realtime-adaptive

## Status: COMPLETED (2026-04-24)

## Outcome
Implemented real-time adaptive engine that shifts word selection strategy based on live performance metrics.

### Key Features
- **Dynamic Strategies**: 
  - `Recovery`: Accuracy < 85%. Serves easier/shorter words.
  - `Balanced`: Accuracy 85-95%. Normal mix of difficulty.
  - `Challenge`: Accuracy > 95%. Focuses on top-difficulty words for the user.
- **Automated Intelligence**: Session finalization triggers the background pipeline automatically via detached `child_process`.
- **Adaptive Cold Start**: The `start` API now attempts to provide an adaptive word list if user history exists, rather than a generic fallback.

## Problems Faced & Solutions
- **Stale Closures**: Live stats in `handleFinish` were capturing old state. Fixed by using a `latestStats` ref to always point to the most recent input/events.
- **Background Pipeline Environment**: Spawned processes couldn't find the database URL. Solution: Explicitly loaded `.env` using `dotenv` in the orchestrator script.
- **Anonymous Sessions**: Data was being saved with `userId: null`, breaking personalization. Solution: Forced `user_1` identification in the frontend and backfilled existing DB records.

## Verification
- Verified strategy shifts in real-time by intentionally dropping accuracy below 85%.
- Verified `wordSkill` record generation after session finish via `check-db.js`.
- Verified metrics accuracy against manual calculation.
