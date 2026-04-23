export default function InsightsPage() {
  return (
    <main>
      <h1>Typing Insights</h1>
      <div className="card">
        <h2>Keyboard Heatmap</h2>
        <p>Heatmap rendering target for weak keys by error frequency.</p>
      </div>
      <div className="card">
        <h2>Speed Trend</h2>
        <p>Speed-over-time chart placeholder for session replay analytics.</p>
      </div>
      <div className="card">
        <h2>Error Hotspots</h2>
        <p>Word and sequence hotspots from personal and sequence-aware models.</p>
      </div>
    </main>
  );
}
