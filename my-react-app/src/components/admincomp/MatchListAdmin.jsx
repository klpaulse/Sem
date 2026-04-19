import { useEffect, useState } from "react";
import { getTeam } from "../../services/TeamService";
import ResultsForm from "./ResultsForm";

export default function MatchListAdmin({
  matches,
  editingMatch,
  setEditingMatch,
  mode // "missing" eller "all"
}) {
  const [teamData, setTeamData] = useState({});
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [location, setLocation] = useState("");

  // Hent lagene
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

    if (matches.length > 0) loadTeams();
  }, [matches]);

  return (
    <section>
      {matches.map((match) => {
        const home = teamData[match.homeTeamId];
        const away = teamData[match.awayTeamId];

        if (!home || !away) {
          return <p key={match.id}>Laster lag...</p>;
        }

        const hasResult =
          match.homeScore != null && match.awayScore != null;

        return (
          <div key={match.id} style={{ marginBottom: "1.5rem" }}>
            <h3>
              {home.name} vs {away.name}
            </h3>

            {match.date?.toDate && (
              <p>
                Dato:{" "}
                {match.date.toDate().toLocaleDateString("no-NO")}
              </p>
            )}

            {hasResult ? (
              <p>
                Resultat: {match.homeScore} - {match.awayScore}
              </p>
            ) : (
              <p>Mangler resultat</p>
            )}

            {/* MODE-STYRING */}
            {mode === "missing" && !hasResult && (
              <button onClick={() => setEditingMatch(match)}>
                Legg inn resultat
              </button>
            )}

            {mode === "all" && hasResult && (
              <button onClick={() => setEditingMatch(match)}>
                Rediger
              </button>
            )}

            {/* RESULTATSKJEMA */}
            {editingMatch?.id === match.id && (
              <ResultsForm
                editingMatch={editingMatch}
                setEditingMatch={setEditingMatch}
                homeScore={homeScore}
                setHomeScore={setHomeScore}
                awayScore={awayScore}
                setAwayScore={setAwayScore}
                location={location}
                setLocation={setLocation}
              />
            )}
          </div>
        );
      })}
    </section>
  );
}





