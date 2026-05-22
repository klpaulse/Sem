export default function GoalWidget({ events, homeScore, awayScore, homeName, awayName, onClose }) {
  const recentEvents = [...events].reverse().slice(0, 9);

  function getIcon(type) {
    if (type === "goal") return "⚽";
    if (type === "comment") return "💬";
    if (type === "image") return "🖼";
    if (type === "yellow") return "🟨";
    if (type === "red") return "🟥";
    if (type === "sub") return "🔄";
    return "•";
  }

  function getEventText(e) {
    if (e.type === "goal") return `Mål ${e.homeScore ?? 0}–${e.awayScore ?? 0}`;
    const raw = e.text || e.comment || e.type || "";
    return raw.length > 30 ? raw.slice(0, 30) + "…" : raw;
  }

  return (
    <div className="goal-widget">
      <div className="goal-widget__header">
        <span className="goal-widget__live">
          <span className="live-dot" />
          LIVE
        </span>
        <button className="goal-widget__close" onClick={onClose}>×</button>
      </div>

      <div className="goal-widget__score">
        <span className="goal-widget__team">{homeName}</span>
        <strong className="goal-widget__result">{homeScore ?? 0} — {awayScore ?? 0}</strong>
        <span className="goal-widget__team">{awayName}</span>
      </div>

      <ul className="goal-widget__events">
        {recentEvents.map(event => (
          <li
            key={event.id}
            className={`goal-widget__event${event.type === "goal" ? " goal-widget__event--goal" : ""}${event.type === "system" ? " goal-widget__event--system" : ""}`}
          >
            <span className="goal-widget__event-icon">{getIcon(event.type)}</span>
            <span className="goal-widget__event-text">{getEventText(event)}</span>
            {event.minute != null && (
              <span className="goal-widget__event-minute">{event.minute}'</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
