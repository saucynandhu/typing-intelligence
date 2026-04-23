type ReplayEvent = {
  id: string;
  key: string;
  isMatch: boolean;
  interKeyDelayMs: number | null;
  usedCorrection: boolean | null;
};

async function getReplay(sessionId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/session/replay/${sessionId}`, { cache: "no-store" });
  if (!response.ok) return null;
  return response.json();
}

export default async function ReplayPage({ params }: { params: { sessionId: string } }) {
  const replay = await getReplay(params.sessionId);
  if (!replay) return <main><p>Replay not found.</p></main>;

  const events = replay.events as ReplayEvent[];
  return (
    <main>
      <h1>Session Replay</h1>
      <div className="card">
        <p>WPM: {replay.totalWpm ?? 0}</p>
        <p>Accuracy: {replay.totalAccuracy ?? 0}%</p>
        <p>Total events: {events.length}</p>
      </div>
      <div className="card">
        <h2>Event Timeline</h2>
        <ul>
          {events.slice(0, 100).map((event) => (
            <li key={event.id}>
              key={event.key} match={String(event.isMatch)} delay={event.interKeyDelayMs ?? 0}ms correction={String(Boolean(event.usedCorrection))}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
