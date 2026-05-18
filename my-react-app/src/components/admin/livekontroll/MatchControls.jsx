export default function MatchControls({ onStart, onPause, onSecondHalf, onEnd, onUndo, liveMatch }) {
  const status = liveMatch?.status;

  return (
    <div className="match-controls">
      <div className="match-controls-main">
        <button
          className="mc-btn mc-btn-start"
          onClick={onStart}
          disabled={status === "live" || status === "finished"}
        >
          Start kamp
        </button>

        <button
          className="mc-btn mc-btn-secondary"
          onClick={onPause}
          disabled={status !== "live"}
        >
          Pause
        </button>

        <button
          className="mc-btn mc-btn-secondary"
          onClick={onSecondHalf}
          disabled={status !== "pause"}
        >
          Start 2. omgang
        </button>

        <button
          className="mc-btn mc-btn-end"
          onClick={onEnd}
          disabled={status === "finished" || status === "not_started"}
        >
          Slutt kamp
        </button>
      </div>

      <button className="mc-btn mc-btn-undo" onClick={onUndo}>
        Angre siste
      </button>
    </div>
  );
}