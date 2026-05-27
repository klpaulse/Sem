export default function MatchSummary({ events, homeTeamId, awayTeamId, homeName, awayName, homeLogo, awayLogo }) {
  const goals = events.filter(e => e.type === "goal" || e.type === "own_goal");
  const cards = events.filter(e => e.type === "yellow" || e.type === "red");
  const subs  = events.filter(e => e.type === "sub");

  const homeGoals = goals.filter(e => e.team === homeTeamId);
  const awayGoals = goals.filter(e => e.team === awayTeamId);
  const homeCards = cards.filter(e => e.team === homeTeamId);
  const awayCards = cards.filter(e => e.team === awayTeamId);
  const homeSubs  = subs.filter(e => e.team === homeTeamId);
  const awaySubs  = subs.filter(e => e.team === awayTeamId);

  if (!goals.length && !cards.length && !subs.length) return (
    <p className="ms-empty">Ingen hendelser registrert</p>
  );

  return (
    <div className="match-summary">

      <div className="ms-team-row">
        <span className="ms-team-name">
          {homeLogo && <img src={homeLogo} alt="" className="ms-team-logo" />}
          {homeName}
        </span>
        <span className="ms-team-name ms-team-name--away">
          {awayName}
          {awayLogo && <img src={awayLogo} alt="" className="ms-team-logo" />}
        </span>
      </div>

      {goals.length > 0 && (
        <div className="ms-section">
          <div className="ms-header">Mal</div>
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

      {subs.length > 0 && (
        <div className="ms-section">
          <div className="ms-header">Bytter</div>
          <div className="ms-cols">
            <ul className="ms-col">
              {homeSubs.map((s, i) => (
                <li key={i} className="ms-item ms-item--sub">
                  {s.playerInName  && <span className="ms-in">&#8593; {s.playerInName}</span>}
                  {s.playerOutName && <span className="ms-out">&#8595; {s.playerOutName}</span>}
                </li>
              ))}
            </ul>
            <ul className="ms-col ms-col--away">
              {awaySubs.map((s, i) => (
                <li key={i} className="ms-item ms-item--sub ms-item--sub-away">
                  {s.playerOutName && <span className="ms-out">&#8595; {s.playerOutName}</span>}
                  {s.playerInName  && <span className="ms-in">&#8593; {s.playerInName}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}
