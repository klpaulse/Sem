export default function MatchReport({match, events}){
    if (!match)

return (
    <div className="report-container">

      {/* Toppseksjon */}
      <div className="report-header">
        <h2>{match.homeTeam} – {match.awayTeam}</h2>
        <p><strong>{match.homeScore}</strong> – <strong>{match.awayScore}</strong></p>
        <p>{match.date.toDate().toLocaleDateString("no-NO")} kl {match.time}</p>
      </div>

      {/* Live feed */}
      <div className="report-feed">
        <h3>Live oppdatering</h3>

        {events.length === 0 && <p>Ingen hendelser ennå.</p>}

        {events.map((e) => (
          <div key={e.id} className={`event event-${e.type}`}>
            <span className="event-icon">{getIcon(e.type)}</span>
            <div className="event-text">
              <p><strong>{e.minute}'</strong> – {e.text}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
