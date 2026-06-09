import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getMatchOutcome } from "../../services/MatchService";

export default function SeasonTimeline({ matches, teamId, currentMatchId }) {
  const navigate = useNavigate();
  const currentRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => {
      const container = containerRef.current;
      const item = currentRef.current;
      if (!container || !item) return;
      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const offset = itemRect.left - containerRect.left - containerRect.width / 2 + itemRect.width / 2;
      container.scrollTo({ left: container.scrollLeft + offset, behavior: "instant" });
    }, 80);
    return () => clearTimeout(id);
  }, [currentMatchId, matches]);

  if (!matches || matches.length === 0) {
    return (
      <div className="timeline-empty">
        Ingen kamper spilt denne sesongen
      </div>
    );
  }

  return (
    <div className="timeline-container" ref={containerRef}>
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
