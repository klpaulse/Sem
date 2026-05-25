import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SeasonTimeline from "./SeasonsTimeline";
import WeatherWidget from "./WeatherWidget";
import { getTeam } from "../../services/TeamService";
import { normalizeDate } from "../../utils/normalizeDate";

export default function BeforeMatchInfo({
  match,
  allMatches,
  homeSeason,
  awaySeason,
  hideTitle = false,
  hideKampinfo = false,
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

      {!hideKampinfo && (
        <div className="info-block">
          <h3 className="timeline-header">Kampinfo</h3>
          <dl className="kampinfo-list">
            <div className="kampinfo-row">
              <dt className="kampinfo-label">
                <svg className="kampinfo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Arena
              </dt>
              <dd className="kampinfo-value">{match.arena || "ukjent"}</dd>
            </div>
            <div className="kampinfo-row">
              <dt className="kampinfo-label">
                <svg className="kampinfo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Dato
              </dt>
              <dd className="kampinfo-value">{matchDate.toLocaleDateString("no-NO")}</dd>
            </div>
            <div className="kampinfo-row">
              <dt className="kampinfo-label">
                <svg className="kampinfo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Tid
              </dt>
              <dd className="kampinfo-value">
                {match.time || matchDate.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })}
              </dd>
            </div>
            <WeatherWidget arena={match.arena} matchDate={matchDate} matchTime={match.time} />
          </dl>
        </div>
      )}
    </section>
  );
}
