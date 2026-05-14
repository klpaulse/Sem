import { useEffect, useState } from "react";
import { db } from "../../config/Firebase";
import { doc, updateDoc, collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { getTeam } from "../../services/TeamService";

export default function ResultsForm({ editingMatch, setEditingMatch }) {
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  // Liste av { playerId, playerName, teamId }
  const [goals, setGoals] = useState([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingMatch) return;

    // Sett eksisterende score hvis den finnes
    setHomeScore(editingMatch.homeScore ?? 0);
    setAwayScore(editingMatch.awayScore ?? 0);
    setGoals([]);

    async function load() {
      const home = await getTeam(editingMatch.homeTeamId);
      const away = await getTeam(editingMatch.awayTeamId);
      setHomeTeam(home);
      setAwayTeam(away);
      setHomePlayers(home?.players || []);
      setAwayPlayers(away?.players || []);
    }

    load();
  }, [editingMatch]);

  function addGoal(teamId, players) {
    setGoals([...goals, { teamId, playerId: "", players }]);

    // Oppdater score automatisk
    if (teamId === editingMatch.homeTeamId) {
      setHomeScore((s) => s + 1);
    } else {
      setAwayScore((s) => s + 1);
    }
  }

  function removeGoal(index) {
    const goal = goals[index];

    // Reduser score
    if (goal.teamId === editingMatch.homeTeamId) {
      setHomeScore((s) => Math.max(0, s - 1));
    } else {
      setAwayScore((s) => Math.max(0, s - 1));
    }

    setGoals(goals.filter((_, i) => i !== index));
  }

  function updateGoalPlayer(index, playerId) {
    const updated = [...goals];
    updated[index].playerId = playerId;
    setGoals(updated);
  }

  async function saveResult() {
    setSaving(true);

    const matchRef = doc(db, "matches", editingMatch.id);

    await updateDoc(matchRef, {
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      played: true,
      status: "finished",
    });

    // Slett gamle events
    const eventsRef = collection(db, "matches", editingMatch.id, "events");
    const oldEvents = await getDocs(eventsRef);
    for (const e of oldEvents.docs) {
      await deleteDoc(e.ref);
    }

    // Legg til nye målscorer-events
    for (const goal of goals) {
      if (goal.playerId) {
        await addDoc(eventsRef, {
          type: "goal",
          teamId: goal.teamId,
          playerId: goal.playerId,
          timestamp: new Date(),
        });
      }
    }

    setSaving(false);
    setEditingMatch(null);
  }

  if (!homeTeam || !awayTeam) return <p>Laster...</p>;

  const homeGoals = goals.filter((g) => g.teamId === editingMatch.homeTeamId);
  const awayGoals = goals.filter((g) => g.teamId === editingMatch.awayTeamId);

  return (
    <div className="results-form">
      <h2>Legg inn resultat</h2>

      {/* SCOREBOARD */}
      <div className="results-scoreboard">
        <div className="results-team">
          <span className="results-team-name">{homeTeam.name}</span>
          <div className="results-score-controls">
            <button
              className="score-btn minus"
              onClick={() => setHomeScore((s) => Math.max(0, s - 1))}
            >−</button>
            <span className="results-score">{homeScore}</span>
            <button
              className="score-btn plus"
              onClick={() => setHomeScore((s) => s + 1)}
            >+</button>
          </div>
        </div>

        <span className="results-vs">–</span>

        <div className="results-team">
          <span className="results-team-name">{awayTeam.name}</span>
          <div className="results-score-controls">
            <button
              className="score-btn minus"
              onClick={() => setAwayScore((s) => Math.max(0, s - 1))}
            >−</button>
            <span className="results-score">{awayScore}</span>
            <button
              className="score-btn plus"
              onClick={() => setAwayScore((s) => s + 1)}
            >+</button>
          </div>
        </div>
      </div>

      {/* MÅLSCORERE */}
      <div className="results-scorers">
        <div className="results-scorers-col">
          <h3>{homeTeam.name}</h3>

          {homeGoals.map((goal, i) => {
            const globalIndex = goals.indexOf(goal);
            return (
              <div key={i} className="scorer-row">
                <select
                  value={goal.playerId}
                  onChange={(e) => updateGoalPlayer(globalIndex, e.target.value)}
                >
                  <option value="">Velg spiller</option>
                  {homePlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  className="remove-scorer"
                  onClick={() => removeGoal(globalIndex)}
                >✕</button>
              </div>
            );
          })}

          <button
            className="add-scorer-btn"
            onClick={() => addGoal(editingMatch.homeTeamId, homePlayers)}
          >
            + Mål
          </button>
        </div>

        <div className="results-scorers-col">
          <h3>{awayTeam.name}</h3>

          {awayGoals.map((goal, i) => {
            const globalIndex = goals.indexOf(goal);
            return (
              <div key={i} className="scorer-row">
                <select
                  value={goal.playerId}
                  onChange={(e) => updateGoalPlayer(globalIndex, e.target.value)}
                >
                  <option value="">Velg spiller</option>
                  {awayPlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  className="remove-scorer"
                  onClick={() => removeGoal(globalIndex)}
                >✕</button>
              </div>
            );
          })}

          <button
            className="add-scorer-btn"
            onClick={() => addGoal(editingMatch.awayTeamId, awayPlayers)}
          >
            + Mål
          </button>
        </div>
      </div>

      {/* HANDLINGER */}
      <div className="results-actions">
        <button
          className="save-btn"
          onClick={saveResult}
          disabled={saving}
        >
          {saving ? "Lagrer..." : "Lagre resultat"}
        </button>
        <button
          className="cancel-btn"
          onClick={() => setEditingMatch(null)}
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}