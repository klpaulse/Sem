import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SeasonTimeline from "./SeasonsTimeline";
import { getTeam } from "../../services/TeamService";
import { normalizeDate } from "../../utils/normalizeDate";

export default function BeforeMatchInfo({
  match,
  allMatches,
  homeSeason,
  awaySeason,
  hideTitle = false,
}) {
  if (!match) return null;

  const matchDate = normalizeDate(match.date);
  const homeId = match.homeTeamId;
  const awayId = match.awayTeamId;

  const [homeName, setHomeName] = useState("Hjemmelag");
  const [awayName, setAwayName] = useState("Bortelag");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadNames() {
      if (homeId) {
        const home = await getTeam(homeId);
        setHomeName(home?.name || "Ukjent lag");
      }
      if (awayId) {
        const away = await getTeam(awayId);
        setAwayName(away?.name || "Ukjent lag");
      }
    }
    loadNames();
  }, [homeId, awayId]);

  const headToHead = allMatches
    .filter(
      (m) =>
        (m.homeTeamId === homeId && m.awayTeamId === awayId) ||
        (m.homeTeamId === awayId && m.awayTeamId === homeId)
    )
    .filter((m) => m.homeScore !== null && m.awayScore !== null)
    .sort((a, b) => normalizeDate(b.date) - normalizeDate(a.date))
    .slice(0, 3);

  return (
    <section className="before-match-info">

      <div className="bmi-columns">
        <div className="info-block">
          <h3 className="timeline-header">Sesongforløp</h3>
          <div className="timeline-row">
            <span className="timeline-team">{homeName}</span>
            <SeasonTimeline matches={homeSeason} teamId={homeId} currentMatchId={match.id} />
          </div>
          <div className="timeline-row">
            <span className="timeline-team">{awayName}</span>
            <SeasonTimeline matches={awaySeason} teamId={awayId} currentMatchId={match.id} />
          </div>
        </div>

        <div className="info-block">
          <h3 className="timeline-header">Siste møter</h3>
          {headToHead.length === 0 ? (
            <p className="h2h-empty">Ingen tidligere møter.</p>
          ) : (
            <ol className="h2h-list">
              {headToHead.map((m) => {
                const date = normalizeDate(m.date).toLocaleDateString("no-NO");
                const hName = m.homeTeamId === homeId ? homeName : awayName;
                const aName = m.awayTeamId === awayId ? awayName : homeName;
                const resultClass =
                  m.homeScore === m.awayScore ? "draw"
                  : m.homeScore > m.awayScore
                  ? (m.homeTeamId === homeId ? "win" : "loss")
                  : (m.homeTeamId === homeId ? "loss" : "win");
                return (
                  <li key={m.id} className="h2h-card" onClick={() => navigate(`/match/${m.slug || m.id}`)} style={{ cursor: "pointer" }}>
                    <div className="h2h-left">
                      <span className="h2h-date">{date}</span>
                      <span className="h2h-matchup">{hName} – {aName}</span>
                    </div>
                    <span className={`h2h-result ${resultClass}`}>
                      {m.homeScore}–{m.awayScore}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      <div className="info-block">
        <h3 className="timeline-header">Kampinfo</h3>
        <dl className="kampinfo-list">
          <div className="kampinfo-row">
            <dt className="kampinfo-label">Arena:</dt>
            <dd className="kampinfo-value">{match.arena || "ukjent"}</dd>
          </div>
          <div className="kampinfo-row">
            <dt className="kampinfo-label">Dato:</dt>
            <dd className="kampinfo-value">{matchDate.toLocaleDateString("no-NO")}</dd>
          </div>
          <div className="kampinfo-row">
            <dt className="kampinfo-label">Tid:</dt>
            <dd className="kampinfo-value">
              {match.time || matchDate.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
