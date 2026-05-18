import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getMatchOutcome } from "../../services/MatchService";

export default function SeasonTimeline({ matches, teamId, currentMatchId }) {
  const navigate = useNavigate();
  const currentRef = useRef(null);

  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [currentMatchId]);

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
        const goalFor = m.homeTeamId === teamId ? m.homeScore : m.awayScore;
        const goalsAgainst = m.homeTeamId === teamId ? m.awayScore : m.homeScore;
        const isPlayed = goalFor != null && goalsAgainst != null;
        const isCurrent = m.id === currentMatchId;

        const letter = isPlayed ? outcome : "·";
        const score = isPlayed ? `${goalFor}-${goalsAgainst}` : null;

        const dateStr = m.date instanceof Date
          ? m.date.toLocaleDateString("no-NO", { day: "numeric", month: "short" })
          : "";

        return (
          <div
            key={m.id}
            ref={isCurrent ? currentRef : null}
            className={`timeline-box ${isPlayed ? `form-${outcome}` : "not-played"} ${isCurrent ? "timeline-current" : ""}`}
            onClick={() => navigate(`/match/${m.slug || m.id}`)}
            title={dateStr}
          >
            <span className="timeline-letter">{letter}</span>
            {score && <span className="timeline-score">{score}</span>}
          </div>
        );
      })}
    </div>
  );
}
