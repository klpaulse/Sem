import { normalizeDate } from "../../utils/normalizeDate";

export default function MatchCard({ match, homeName, awayName, onClick }) {
  const matchDate = normalizeDate(match.date);
  const played = match.homeScore !== null && match.awayScore !== null;
  const status = (match.status || "").toLowerCase();

  const now = new Date();
  const isPast = matchDate && matchDate < now && matchDate.toDateString() !== now.toDateString();

  const isLive = status === "live" || status === "pause";
  const isPaused = status === "pause";
  const isEnded = status === "finished" || isPast;

  const homeWon = played && match.homeScore > match.awayScore;
  const awayWon = played && match.awayScore > match.homeScore;

  return (
    <article
      className={`match-card ${isLive ? "live-glow" : ""}`}
      onClick={onClick}
    >
      <div className="match-card-teams">
        <div className="row">
          <span className={`left-col ${homeWon ? "winner" : awayWon ? "loser" : ""}`}>
            {played ? match.homeScore : "-"}
          </span>
          <span className={`team ${homeWon ? "winner" : awayWon ? "loser" : ""}`}>
            {homeName}
          </span>
        </div>

        <div className="row">
          <span className={`left-col ${awayWon ? "winner" : homeWon ? "loser" : ""}`}>
            {played ? match.awayScore : "-"}
          </span>
          <span className={`team ${awayWon ? "winner" : homeWon ? "loser" : ""}`}>
            {awayName}
          </span>
        </div>
      </div>

      <div className="match-right">
        {isEnded ? (
          <span className="match-status-ended">Slutt</span>
        ) : isPaused ? (
          <span className="match-status-pause">Pause</span>
        ) : isLive ? (
          <span className="match-status-live">LIVE</span>
        ) : (
          <span className="match-time-box">
            {match.time || matchDate?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </article>
  );
}
