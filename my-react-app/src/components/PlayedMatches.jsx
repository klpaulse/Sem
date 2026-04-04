import { useEffect, useState } from "react";
import { getTeam } from "../services/TeamService";

export default function PlayedMatches({ matches }) {
  const [teamData, setTeamData] = useState({}); // cache for lag
  const now = new Date();

  // Filtrer ferdigspilte kamper
  const past = matches
    .filter((m) => {
      if (!m.date) return false;

      const baseDate = m.date.toDate ? m.date.toDate() : new Date(m.date);
      if (isNaN(baseDate)) return false;

      const datePart = baseDate.toISOString().split("T")[0];
      const matchDateTime = new Date(`${datePart}T${m.time}`);

      return matchDateTime < now;
    })
    .sort((a, b) => {
      const aBase = a.date.toDate ? a.date.toDate() : new Date(a.date);
      const bBase = b.date.toDate ? b.date.toDate() : new Date(b.date);

      const aDate = new Date(`${aBase.toISOString().split("T")[0]}T${a.time}`);
      const bDate = new Date(`${bBase.toISOString().split("T")[0]}T${b.time}`);

      return bDate - aDate; // nyeste først
    });

  // Hent lag basert på ID
  useEffect(() => {
    async function loadTeams() {
      const cache = {};

      for (const match of past) {
        if (!cache[match.homeTeam]) {
          cache[match.homeTeam] = await getTeam(match.homeTeam);
        }
        if (!cache[match.awayTeam]) {
          cache[match.awayTeam] = await getTeam(match.awayTeam);
        }
      }

      setTeamData(cache);
    }

    if (past.length > 0) {
      loadTeams();
    }
  }, [past]);

  return (
    <section>
      <h2>Spilte kamper</h2>

      {past.length === 0 && <p>Ingen spilte kamper ennå</p>}

      {past.map((m, index) => {
        const home = teamData[m.homeTeam];
        const away = teamData[m.awayTeam];

        if (!home || !away) {
          return <p key={index}>Laster lag...</p>;
        }

        const baseDate = m.date.toDate ? m.date.toDate() : new Date(m.date);
        const datePart = baseDate.toISOString().split("T")[0];
        const kampDato = new Date(`${datePart}T${m.time}`);

        const harResultat =
          m.homeScore !== null &&
          m.homeScore !== undefined &&
          m.awayScore !== null &&
          m.awayScore !== undefined;

        return (
          <div key={index} style={{ marginBottom: "1rem" }}>
            <p>
              {m.day} {kampDato.toLocaleDateString("no-NO")} – Ferdig
            </p>

            {harResultat ? (
              <p>
                {home.teamName} {m.homeScore} – {m.awayScore} {away.teamName}
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