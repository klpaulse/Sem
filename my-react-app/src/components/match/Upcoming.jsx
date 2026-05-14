import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTeam } from "../../services/TeamService";
import { normalizeDate } from "../../utils/normalizeDate";

export default function Upcoming({ matches }) {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [teamNames, setTeamNames] = useState({});
  const navigate = useNavigate();

  // ⭐ Hent lagnavn basert på ID
  useEffect(() => {
    async function loadNames() {
      const map = {};

      for (const m of matches) {
        if (m.homeTeamId && !map[m.homeTeamId]) {
          map[m.homeTeamId] = await getTeam(m.homeTeamId);
        }
        if (m.awayTeamId && !map[m.awayTeamId]) {
          map[m.awayTeamId] = await getTeam(m.awayTeamId);
        }
      }

      setTeamNames(map);
    }

    if (matches.length > 0) loadNames();
  }, [matches]);

  // ⭐ Finn kommende kamper
  useEffect(() => {
    if (!matches || matches.length === 0) return;

    const now = new Date();

    const upcoming = matches
      .map((m) => ({ ...m, dateObj: normalizeDate(m.date) }))
      .filter((m) => m.dateObj && m.dateObj >= now)
      .sort((a, b) => a.dateObj - b.dateObj);

    setUpcomingMatches(upcoming);
  }, [matches]);

  if (upcomingMatches.length === 0) {
    return (
      <section>
        <h2>Kommende kamper</h2>
        <p>Ingen kommende kamper</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Kommende kamper</h2>

      <ol className="match-list">
        {upcomingMatches.map((m) => {
          const matchDate = m.dateObj;

          const homeName = teamNames[m.homeTeamId]?.name || "Ukjent lag";
          const awayName = teamNames[m.awayTeamId]?.name || "Ukjent lag";

          return (
            <li key={m.id}>
              <article
                className="match-clickable"
                onClick={() => navigate(`/match/${m.slug || m.id}`)}
              >
                <p>
                  {matchDate.toLocaleDateString("no-NO")} – {m.time}
                </p>
                <p>
                  {homeName} vs {awayName}
                </p>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
