import TeamLogo from "../shared/TeamLogo";

export default function MatchSummary({ events, homeTeamId, awayTeamId, homeName, awayName, homeLogo, awayLogo }) {
  const goals = events.filter(e => e.type === "goal" || e.type === "own_goal");
  const cards = events.filter(e => e.type === "yellow" || e.type === "red");

  const homeGoals = goals.filter(e => e.team === homeTeamId);
  const awayGoals = goals.filter(e => e.team === awayTeamId);
  const homeCards = cards.filter(e => e.team === homeTeamId);
  const awayCards = cards.filter(e => e.team === awayTeamId);

  if (!goals.length && !cards.length) return (
    <p className="ms-empty">Ingen hendelser registrert</p>
  );

  return (
    <div className="match-summary">

      <div className="ms-team-row">
        <span className="ms-team-name">
          <TeamLogo logoUrl={homeLogo} name={homeName} size={22} />
          {homeName}
        </span>
        <span className="ms-team-name ms-team-name--away">
          {awayName}
          <TeamLogo logoUrl={awayLogo} name={awayName} size={22} />
        </span>
      </div>

      {goals.length > 0 && (
        <div className="ms-section">
          <div className="ms-header">Mål</div>
          <div className="ms-cols">
            <ul className="ms-col">
              {homeGoals.map((g, i) => (
                <li key={i} className="ms-item">
                  <span className={`ms-dot ms-dot--goal${g.type === "own_goal" ? " ms-dot--og" : ""}`} />
                  <span className="ms-name">
                    {g.playerName || "Ukjent"}
                    {g.type === "own_goal" && <em className="ms-og"> (selvmål)</em>}
                  </span>
                </li>
              ))}
            </ul>
            <ul className="ms-col ms-col--away">
              {awayGoals.map((g, i) => (
                <li key={i} className="ms-item ms-item--away">
                  <span className="ms-name">
                    {g.playerName || "Ukjent"}
                    {g.type === "own_goal" && <em className="ms-og"> (selvmål)</em>}
                  </span>
                  <span className={`ms-dot ms-dot--goal${g.type === "own_goal" ? " ms-dot--og" : ""}`} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {cards.length > 0 && (
        <div className="ms-section">
          <div className="ms-header">Kort</div>
          <div className="ms-cols">
            <ul className="ms-col">
              {homeCards.map((c, i) => (
                <li key={i} className="ms-item">
                  <span className={`ms-dot ms-dot--${c.type}`} />
                  <span className="ms-name">{c.playerName || "Ukjent"}</span>
                </li>
              ))}
            </ul>
            <ul className="ms-col ms-col--away">
              {awayCards.map((c, i) => (
                <li key={i} className="ms-item ms-item--away">
                  <span className="ms-name">{c.playerName || "Ukjent"}</span>
                  <span className={`ms-dot ms-dot--${c.type}`} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}


    </div>
  );
}
