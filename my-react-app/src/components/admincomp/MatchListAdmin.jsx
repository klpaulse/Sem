import { useEffect, useState } from "react";
import { getTeam } from "../../services/TeamService";

export default function MatchListAdmin({ matches, setEditingMatch, deleteMatch }) {
  const [teamData, setTeamData] = useState({}); // cache for lag

  // Hent alle lag som trengs
  useEffect(() => {
    async function loadTeams() {
      const cache = {};

      for (const match of matches) {
        if (match.homeTeamId && !cache[match.homeTeamId]) {
          cache[match.homeTeamId] = await getTeam(match.homeTeamId);
        }
        if (match.awayTeamId && !cache[match.awayTeamId]) {
          cache[match.awayTeamId] = await getTeam(match.awayTeamId);
        }
      }

      setTeamData(cache);
    }

    if (matches.length > 0) {
      loadTeams();
    }
  }, [matches]);

  return (
    <section>
      <h2>Alle kamper</h2>

      {matches.map((match) => {
        const home = teamData[match.homeTeamId];
        const away = teamData[match.awayTeamId];

        if (!home || !away) {
          return <p key={match.id}>Laster lag...</p>;
        }

        return (
          <div key={match.id}>
            <h2>
              {home.name} vs {away.name}
            </h2>

            {/* Dato */}
            {match.homeScore == null && match.date?.toDate && (
              <p>Dato: {match.date.toDate().toLocaleDateString("no-NO")}</p>
            )}

            {/* Resultat */}
            {match.homeScore != null ? (
              <p>
                Resultat: {match.homeScore} - {match.awayScore}
              </p>
            ) : (
              <button onClick={() => setEditingMatch(match)}>Legg inn resultat</button>
            )}

            <button onClick={() => deleteMatch(match.id)}>Slett kamp</button>
          </div>
        );
      })}
    </section>
  );
}