import { getMatchOutcome } from "../../services/MatchService";

export default function SeasonTimeline({ matches, teamId, currentMatchId }) {
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

        const goalFor =
          m.homeTeamId === teamId ? m.homeScore : m.awayScore;

        const goalsAgainst =
          m.homeTeamId === teamId ? m.awayScore : m.homeScore;

        const isPlayed =
          goalFor !== null &&
          goalFor !== undefined &&
          goalsAgainst !== null &&
          goalsAgainst !== undefined;

        const displayFor = isPlayed ? goalFor : "–";
        const displayAgainst = isPlayed ? goalsAgainst : "–";

        const isCurrent = m.id === currentMatchId;

        return (
          <div
            key={m.id}
            className={`timeline-box ${
              isPlayed ? `form-${outcome}` : "not-played"
            } ${isCurrent ? "timeline-current" : ""}`}
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
