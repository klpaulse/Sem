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
      const home = await getTeam(editingMatch.homeTeamId);
      const away = await getTeam(editingMatch.awayTeamId);

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
        {editingMatch.homeTeamName} vs {editingMatch.awayTeamName}
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

  

      <button onClick={saveResult}>Lagre resultat</button>
      <button onClick={() => setEditingMatch(null)}>Avbryt</button>
    </section>
  );
}