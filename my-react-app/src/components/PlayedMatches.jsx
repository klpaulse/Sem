import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getTeam } from "../../services/TeamService";

function normalizeDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (d.toDate) return d.toDate();
  return new Date(d);
}

export default function PlayedMatches({ matches }) {
  const navigate = useNavigate();
  const now = new Date();

  const [teamNames, setTeamNames] = useState({});

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

  // ⭐ Lag liste over spilte kamper
  const past = matches
    .map((m) => {
      const baseDate = normalizeDate(m.date);
      if (!baseDate || isNaN(baseDate)) return null;

      const datePart = baseDate.toISOString().split("T")[0];
      const matchDateTime = new Date(`${datePart}T${m.time}`);

      return { ...m, matchDateTime };
    })
    .filter((m) => m && m.matchDateTime < now)
    .sort((a, b) => b.matchDateTime - a.matchDateTime);

  return (
    <section>
      <h2>Spilte kamper</h2>

      {past.length === 0 && <p>Ingen spilte kamper ennå</p>}

      {past.map((m, index) => {
        const kampDato = m.matchDateTime;

        const homeName = teamNames[m.homeTeamId]?.name || "Ukjent lag";
        const awayName = teamNames[m.awayTeamId]?.name || "Ukjent lag";

        const harResultat =
          m.homeScore !== null &&
          m.homeScore !== undefined &&
          m.awayScore !== null &&
          m.awayScore !== undefined;

        return (
          <div
            key={index}
            className="match-clickable"
            onClick={() => navigate(`/match/${m.id}`, { state: { match: m } })}
          >
            <p>{kampDato.toLocaleDateString("no-NO")} – Ferdig</p>

            {harResultat ? (
              <p>
                {homeName} {m.homeScore} – {m.awayScore} {awayName}
              </p>
            ) : (
              <p>Resultat kommer</p>
            )}
          </div>
        );
      })}
    </section>
  );
}