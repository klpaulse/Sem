const STATUS_LABEL = {
  not_started: { text: "Ikke startet", color: "#888" },
  live:        { text: "LIVE", color: "#2ecc71" },
  pause:       { text: "Pause", color: "#f1c40f" },
  finished:    { text: "Slutt", color: "#e74c3c" },
};

export default function LiveHeader({ liveMatch, onBack, homeTeam, awayTeam }) {
  const status = (liveMatch?.status || "not_started");
  const badge = STATUS_LABEL[status] || STATUS_LABEL.not_started;

  return (
    <div className="live-header-bar">
      <button
        className="live-back-btn"
        aria-label="Tilbake"
        onClick={() => {
          if (liveMatch?.status === "live") {
            const leave = window.confirm("Kampen er i gang. Vil du forlate live-kampen?");
            if (!leave) return;
          }
          onBack();
        }}
      />

      <div className="live-header-info">
        <p className="live-header-teams">
          {homeTeam?.name && awayTeam?.name
            ? `${homeTeam.name} – ${awayTeam.name}`
            : "Livekontroll"}
        </p>
        <span className="live-status-badge" style={{ color: badge.color }}>
          {badge.text}
        </span>
      </div>
    </div>
  );
}