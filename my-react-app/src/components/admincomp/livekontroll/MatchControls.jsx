export default function MatchControls({
  onStart,
  onPause,
  onSecondHalf,
  onEnd,
  onUndo,
  liveMatch,
}) {
  const status = liveMatch?.status;

  return (
    <div className="match-controls">
      <button
        onClick={onStart}
        disabled={status === "live" || status === "finished"}
      >
        Start kamp
      </button>
      <button
        onClick={onPause}
        disabled={status !== "live"}
      >
        Pause
      </button>
      <button
        onClick={onSecondHalf}
        disabled={status !== "halftime"}
      >
        Start 2. omgang
      </button>
      <button
        onClick={onEnd}
        disabled={status === "finished" || status === "notStarted"}
      >
        Slutt kamp
      </button>
      <button onClick={onUndo}>
        Angre siste
      </button>
    </div>
  );
}