import { useEffect, useState } from "react";
import { getTeam } from "../../services/TeamService";

export default function ResultsForm({
  editingMatch,
  setEditingMatch,
  homeScore,
  setHomeScore,
  awayScore,
  setAwayScore,
  location,
  setLocation,
  saveResult
}) {
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);

  // Hent lagnavn basert på ID
  useEffect(() => {
    if (!editingMatch) return;

    async function loadTeams() {
      const home = await getTeam(editingMatch.homeTeam);
      const away = await getTeam(editingMatch.awayTeam);

      setHomeTeam(home);
      setAwayTeam(away);
    }

    loadTeams();
  }, [editingMatch]);

  if (!homeTeam || !awayTeam) {
    return <p>Laster lag...</p>;
  }

  return (
    <section>
      <h2>Legg inn resultat</h2>

      <p>
        {homeTeam.teamName} vs {awayTeam.teamName}
      </p>

      <input
        type="number"
        placeholder="Hjemmelag score"
        value={homeScore}
        onChange={(e) => setHomeScore(e.target.value)}
      />

      <input
        type="number"
        placeholder="Bortelag score"
        value={awayScore}
        onChange={(e) => setAwayScore(e.target.value)}
      />

      {/* Lokasjon */}
      <input
        placeholder="Sted"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      <button onClick={saveResult}>Lagre resultat</button>
      <button onClick={() => setEditingMatch(null)}>Avbryt</button>
    </section>
  );
}