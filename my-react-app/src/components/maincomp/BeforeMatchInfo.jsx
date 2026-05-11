import { useEffect, useState } from "react";
import SeasonTimeline from "./SeasonsTimeline";
import { getTeam } from "../../services/TeamService";

// 🔥 Felles dato-normalisering
function normalizeDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (d.toDate) return d.toDate(); // Firestore Timestamp
  return new Date(d); // ISO string
}

export default function BeforeMatchInfo({
  match,
  allMatches,
  homeSeason,
  awaySeason,
  hideTitle = false 
}) {
  if (!match) return null;

  const matchDate = normalizeDate(match.date);

  const homeId = match.homeTeamId;
  const awayId = match.awayTeamId;

  const [homeName, setHomeName] = useState("Hjemmelag");
  const [awayName, setAwayName] = useState("Bortelag");

  // ⭐ Hent lagnavn basert på ID
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

  // ⭐ Head-to-head (siste 3 oppgjør)
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

      {/* ⭐ TIMELINE FOR BEGGE LAG – ALLTID VIST */}
      <div className="info-block">
        <h3 className="timeline-header">Sesongforløp</h3>

        
        <div className="timeline-row">
          <span className="timeline-team">{homeName}</span>
        <SeasonTimeline
          matches={homeSeason}
          teamId={homeId}
          currentMatchId={match.id}
        />
        </div>

        <div className="timeline-row">
          <span className="timeline-team">{awayName}</span>
        <SeasonTimeline
          matches={awaySeason}
          teamId={awayId}
          currentMatchId={match.id}
        />
      </div>
      </div>
      
    

      {/* ⭐ HEAD TO HEAD */}
      <div className="info-block">
        <h3 className="timeline-header">Siste møter</h3>

        {headToHead.map((m) => {
          const date = normalizeDate(m.date).toLocaleDateString("no-NO");
          const division = m.division || "Ukjent divisjon";

          const hName = m.homeTeamId === homeId ? homeName : awayName;
          const aName = m.awayTeamId === awayId ? awayName : homeName;

          return (
            <div key={m.id} className="h2h-card">
              <div className="h2h-left">
                <span className="h2h-date">{date}</span>
                <span className="h2h-matchup">
                  {hName} - {aName}
                </span>
              </div>

              <span className={`h2h-result ${
                m.homeScore === m.awayScore
                ? "draw"
                : m.homeScore > m.awayScore
                ? (m.homeTeamId === homeId ? "win" : "loss")
                : (m.homeTeamId === homeId ? "loss" : "win")
              }`}
              >
                {m.homeScore}-{m.awayScore}</span>
            </div>
          );
        })}
      </div>

      {/* ⭐ KAMPINFO */}
      {!hideTitle && (
      <div className="info-block">
        <h3 className="timeline-header">Kampinfo</h3>

        <div className="kampinfo-row">
          <span className="kampinfo-label">Arena:</span>
          <span className="kampinfo-value">{match.arena || "ukjent"}</span>
        </div>

        <div className="kampinfo-row">
          <span className="kampinfo-label">Dato:</span>
          <span className="kampinfo-value">
            {matchDate.toLocaleDateString("no-NO")}
          </span>
        </div>

        <div className="kampinfo-row">
          <span className="kampinfo-label">Tid:</span>
          <span className="kampinfo-value">
            {match.time ||
              matchDate.toLocaleTimeString("no-NO", {
                hour: "2-digit",
                minute: "2-digit",
              })}
          </span>
        </div>
      </div>
      )}
    </section>
  );
}
