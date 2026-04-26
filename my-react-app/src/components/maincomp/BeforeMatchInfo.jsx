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
      <h2 className="beforematch">Før kampen</h2>

      {/* ⭐ TIMELINE */}
      <div className="info-block">
        <h3 className="timeline-header">{homeName}</h3>
        <SeasonTimeline
          matches={homeSeason}
          teamId={homeId}
          currentMatchId={match.id}
        />

        <h3 className="timeline-header">{awayName}</h3>
        <SeasonTimeline
          matches={awaySeason}
          teamId={awayId}
          currentMatchId={match.id}
        />
      </div>

      {/* ⭐ HEAD TO HEAD */}
      <div className="info-block">
        <h3>Siste møter</h3>

        {headToHead.map((m) => {
          const date = normalizeDate(m.date).toLocaleDateString("no-NO");
          const division = m.division || "Ukjent divisjon";

          const hName = m.homeTeamId === homeId ? homeName : awayName;
          const aName = m.awayTeamId === awayId ? awayName : homeName;

          return (
            <div key={m.id} className="h2h-match">
              <div className="h2h-left">
                <span className="h2h-date">{date}</span>
                <span className="h2h-teams">
                  {hName} {m.homeScore}-{m.awayScore} {aName}
                </span>
              </div>

              <span className="h2h-division">{division}</span>
            </div>
          );
        })}
      </div>

      {/* ⭐ KAMPINFO */}
      <div className="info-block">
        <h3>Kampinfo</h3>

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

        <div className="kampinfo-row">
          <span className="kampinfo-value">{match.round}</span>
        </div>

        <div className="kampinfo-row">
          <span className="kampinfo-label">Sesong:</span>
          <span className="kampinfo-value">2026</span>
        </div>
      </div>
    </section>
  );
}