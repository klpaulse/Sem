import { getMatchOutcome } from "../../services/MatchService";

export default function SeasonTimeline({ matches, teamId, currentMatchId }) {
  // ⭐ Fallback når laget ikke har noen kamper
  if (!matches || matches.length === 0) {
    return (
      <div className="timeline-empty">
        Ingen kamper spilt denne sesongen
      </div>
    );
  }

  return (
    <div className="timeline-container">
      {matches.map((m) => {
        const outcome = getMatchOutcome(m, teamId);

        // ⭐ Score fallback (viser "-" hvis kampen ikke er spilt)
        const goalFor =
          m.homeTeamId === teamId ? m.homeScore : m.awayScore;

        const goalsAgainst =
          m.homeTeamId === teamId ? m.awayScore : m.homeScore;

        const displayFor = goalFor ?? "-";
        const displayAgainst = goalsAgainst ?? "-";

        const isCurrent = m.id === currentMatchId;

        return (
          <div
            key={m.id}
            className={`timeline-box form-${outcome} ${
              isCurrent ? "timeline-current" : ""
            }`}
          >
            <span className="timeline-result">
              {displayFor}-{displayAgainst}
            </span>
          </div>
        );
      })}
    </div>
  );
}

