import { useEffect, useState } from "react";
import { getAllMatches, updateMatchResult } from "../../services/MatchService";
import ResultsForm from "./ResultsForm";

export default function AdminMatches({ onSelectMatch }) {
  const [matches, setMatches] = useState([]);
  const [editingMatch, setEditingMatch] = useState(null);

  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    async function load() {
      const all = await getAllMatches();
      setMatches(all);
    }
    load();
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const todaysMatches = matches.filter(m => {
    const d = m.date;
    return d.toISOString().split("T")[0] === today;
  });

  const missingResults = matches.filter(m => {
    const d = m.date;
    return d < new Date() && (m.homeScore === null || m.awayScore === null);
  });

  const completedMatches = matches.filter(m => {
    return m.homeScore !== null && m.awayScore !== null;
  });

  function startEditing(match) {
    setEditingMatch(match);
    setHomeScore(match.homeScore ?? "");
    setAwayScore(match.awayScore ?? "");
    setLocation(match.location ?? "");
  }

  async function saveResult() {
    await updateMatchResult(
      editingMatch.id,
      homeScore,
      awayScore,
      location
    );

    setMatches(prev =>
      prev.map(m =>
        m.id === editingMatch.id
          ? { ...m, homeScore, awayScore, location, played: true }
          : m
      )
    );

    setEditingMatch(null);
  }

  return (
    <section className="admin-page">
      <h1>Admin – Kamper</h1>

      {/* Dagens kamper */}
      <h2>Dagens kamper</h2>
      {todaysMatches.length === 0 && <p>Ingen kamper i dag.</p>}
      {todaysMatches.map(m => (
        <div
          key={m.id}
          className="admin-match-row"
          onClick={() => onSelectMatch(m.id)}  
        >
          {m.homeTeamName} – {m.awayTeamName}
        </div>
      ))}

      {/* Kamper uten resultat */}
      <h2>Tidligere kamper uten resultat</h2>

      {missingResults.map(m => (
        <details key={m.id} open={editingMatch?.id === m.id}>
          <summary
            onClick={() => onSelectMatch(m.id)}   
            style={{ cursor: "pointer" }}
          >
            {m.date.toLocaleDateString("no-NO")} – {m.homeTeamName} vs {m.awayTeamName}
          </summary>

          <div style={{ padding: "10px 0" }}>
            {editingMatch?.id !== m.id && (
              <div
                className="admin-match-row"
                onClick={() => startEditing(m)}
                style={{ cursor: "pointer" }}
              >
                Legg inn resultat
              </div>
            )}

            {editingMatch?.id === m.id && (
              <div className="result-card">
                <ResultsForm
                  editingMatch={editingMatch}
                  setEditingMatch={setEditingMatch}
                  homeScore={homeScore}
                  setHomeScore={setHomeScore}
                  awayScore={awayScore}
                  setAwayScore={setAwayScore}
                  location={location}
                  setLocation={setLocation}
                  saveResult={saveResult}
                />
              </div>
            )}
          </div>
        </details>
      ))}

      {/* Endre resultat */}
      <h2>Endre resultat</h2>

      {completedMatches.map(m => (
        <details key={m.id} open={editingMatch?.id === m.id}>
          <summary
            onClick={() => onSelectMatch(m.id)}   
            style={{ cursor: "pointer" }}
          >
            {m.date.toLocaleDateString("no-NO")} – {m.homeTeamName} vs {m.awayTeamName}
            {" "}({m.homeScore}–{m.awayScore})
          </summary>

          <div style={{ padding: "10px 0" }}>
            {editingMatch?.id !== m.id && (
              <div
                className="admin-match-row"
                onClick={() => startEditing(m)}
                style={{ cursor: "pointer" }}
              >
                Endre resultat
              </div>
            )}

            {editingMatch?.id === m.id && (
              <div className="result-card">
                <ResultsForm
                  editingMatch={editingMatch}
                  setEditingMatch={setEditingMatch}
                  homeScore={homeScore}
                  setHomeScore={setHomeScore}
                  awayScore={awayScore}
                  setAwayScore={setAwayScore}
                  location={location}
                  setLocation={setLocation}
                  saveResult={saveResult}
                />
              </div>
            )}
          </div>
        </details>
      ))}
    </section>
  );
}