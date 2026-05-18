import { normalizeDate } from "../../utils/normalizeDate";

export default function MatchCard({ match, homeName, awayName, onClick, showDate = false }) {
  const matchDate = normalizeDate(match.date);
  const played = match.homeScore !== null && match.awayScore !== null;
  const status = (match.status || "").toLowerCase();

  const now = new Date();
  const isPast = matchDate && matchDate < now && matchDate.toDateString() !== now.toDateString();
  const isLive = status === "live";
  const isPaused = status === "pause";
  const isEnded = status === "finished" || (isPast && !isLive && !isPaused);

  const homeWon = played && match.homeScore > match.awayScore;
  const awayWon = played && match.awayScore > match.homeScore;

  const timeStr =
    match.time ||
    matchDate?.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" });

  const dateStr = matchDate?.toLocaleDateString("no-NO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  let badgeType, badgeLabel;
  if (isLive)        { badgeType = "live";  badgeLabel = "LIVE"; }
  else if (isPaused) { badgeType = "pause"; badgeLabel = "Pause"; }
  else if (isEnded)  { badgeType = "ended"; badgeLabel = "Slutt"; }
  else               { badgeType = "time";  badgeLabel = timeStr; }

  return (
    <article
      className={`match-card${isLive || isPaused ? " live-glow" : ""}`}
      onClick={onClick}
    >
      {showDate && <span className="match-card-date">{dateStr}</span>}

      <div className="match-card-body">
        <div className="match-card-teams">
          <div className="match-card-row">
            <span className={`match-card-score${homeWon ? " winner" : awayWon ? " loser" : ""}${!played ? " not-played" : ""}`}>
              {played ? match.homeScore : "-"}
            </span>
            <span className={`match-card-name${homeWon ? " winner" : awayWon ? " loser" : ""}`}>
              {homeName}
            </span>
          </div>

          <div className="match-card-row">
            <span className={`match-card-score${awayWon ? " winner" : homeWon ? " loser" : ""}${!played ? " not-played" : ""}`}>
              {played ? match.awayScore : "-"}
            </span>
            <span className={`match-card-name${awayWon ? " winner" : homeWon ? " loser" : ""}`}>
              {awayName}
            </span>
          </div>
        </div>

        <span className={`match-badge match-badge--${badgeType}`}>{badgeLabel}</span>
      </div>
    </article>
  );
}
