import { useEffect, useState } from "react";
import { db } from "../../config/Firebase";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
import { getTeam } from "../../services/TeamService";

export default function ResultsForm({
  editingMatch,
  setEditingMatch,
  homeScore,
  setHomeScore,
  awayScore,
  setAwayScore,
  location,
  setLocation
}) {
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);

  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);

  const [homeScorers, setHomeScorers] = useState([]);
  const [awayScorers, setAwayScorers] = useState([]);

  useEffect(() => {
    if (!editingMatch) return;

    async function load() {
      const home = await getTeam(editingMatch.homeTeamId);
      const away = await getTeam(editingMatch.awayTeamId);

      setHomeTeam(home);
      setAwayTeam(away);

      // samme logikk som du bruker i LiveControls
      setHomePlayers(home.players || []);
      setAwayPlayers(away.players || []);
    }

    load();
  }, [editingMatch]);

  function addHomeScorer() {
    setHomeScorers([...homeScorers, ""]);
  }

  function addAwayScorer() {
    setAwayScorers([...awayScorers, ""]);
  }

  function updateHomeScorer(i, value) {
    const updated = [...homeScorers];
    updated[i] = value;
    setHomeScorers(updated);
  }

  function updateAwayScorer(i, value) {
    const updated = [...awayScorers];
    updated[i] = value;
    setAwayScorers(updated);
  }

  async function saveResult() {
    const matchRef = doc(db, "matches", editingMatch.id);

    await updateDoc(matchRef, {
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      status: "finished"
    });

    const eventsRef = collection(db, "matches", editingMatch.id, "events");

    for (const scorer of homeScorers) {
      if (scorer) {
        await addDoc(eventsRef, {
          type: "goal",
          teamId: editingMatch.homeTeamId,
          playerId: scorer,
          timestamp: new Date()
        });
      }
    }

    for (const scorer of awayScorers) {
      if (scorer) {
        await addDoc(eventsRef, {
          type: "goal",
          teamId: editingMatch.awayTeamId,
          playerId: scorer,
          timestamp: new Date()
        });
      }
    }

    setEditingMatch(null);
  }

  if (!homeTeam || !awayTeam) {
    return <p>Laster lag...</p>;
  }

  return (
    <section>
      <h2>Legg inn resultat</h2>

      <p>
        {homeTeam.name} vs {awayTeam.name}
      </p>

      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        min="0"
        placeholder="Hjemmelag score"
        value={homeScore}
        onChange={(e) => setHomeScore(e.target.value)}
      />

      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        min="0"
        placeholder="Bortelag score"
        value={awayScore}
        onChange={(e) => setAwayScore(e.target.value)}
      />

      <h3>Målscorere – {homeTeam.name}</h3>
      {homeScorers.map((scorer, i) => (
        <select
          key={i}
          value={scorer}
          onChange={(e) => updateHomeScorer(i, e.target.value)}
        >
          <option value="">Velg spiller</option>
          {homePlayers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      ))}
      <button onClick={addHomeScorer}>+ Legg til målscorer</button>

      <h3>Målscorere – {awayTeam.name}</h3>
      {awayScorers.map((scorer, i) => (
        <select
          key={i}
          value={scorer}
          onChange={(e) => updateAwayScorer(i, e.target.value)}
        >
          <option value="">Velg spiller</option>
          {awayPlayers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      ))}
      <button onClick={addAwayScorer}>+ Legg til målscorer</button>

      <br /><br />
      <button onClick={saveResult}>Lagre resultat</button>
      <button onClick={() => setEditingMatch(null)}>Avbryt</button>
    </section>
  );
}



