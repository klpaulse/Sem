import { useEffect, useState } from "react";
import { getAllMatches, updateMatchResult } from "../../services/MatchService";
import { getTeam } from "../../services/TeamService";
import ResultsForm from "./ResultsForm";

// Trygg dato-normalisering
function normalizeDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (d.toDate) return d.toDate(); // Firestore Timestamp
  const parsed = new Date(d);
  return isNaN(parsed) ? null : parsed;
}

export default function AdminMatches({ selectedDate, onSelectMatch }) {
  const [matches, setMatches] = useState([]);
  const [editingMatch, setEditingMatch] = useState(null);

  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [location, setLocation] = useState("");

  const [teams, setTeams] = useState({});

  // Hent alle kamper
  useEffect(() => {
    async function load() {
      const all = await getAllMatches();
      setMatches(all);
    }
    load();
  }, []);

  // Hent lag for alle kamper
  useEffect(() => {
    async function loadTeams() {
      const cache = {};

      for (const m of matches) {
        if (m.homeTeamId && !cache[m.homeTeamId]) {
          cache[m.homeTeamId] = await getTeam(m.homeTeamId);
        }
        if (m.awayTeamId && !cache[m.awayTeamId]) {
          cache[m.awayTeamId] = await getTeam(m.awayTeamId);
        }
      }

      setTeams(cache);
    }

    if (matches.length > 0) loadTeams();
  }, [matches]);

  // Hvis selectedDate ikke finnes enda → ikke crash
  if (!selectedDate) {
    return <p>Velg en dato</p>;
  }

  const normalizedSelected = normalizeDate(selectedDate);
  if (!normalizedSelected) {
    return <p>Ugyldig dato valgt</p>;
  }

  const selectedDay = normalizedSelected.toISOString().split("T")[0];

  // Filtrer kamper for valgt dag
  const matchesForDay = matches.filter((m) => {
    const matchDate = normalizeDate(m.date);
    if (!matchDate) return false;
    const matchDay = matchDate.toISOString().split("T")[0];
    return matchDay === selectedDay;
  });

  // Start redigering
  function startEditing(match) {
    setEditingMatch(match);
    setHomeScore(match.homeScore ?? "");
    setAwayScore(match.awayScore ?? "");
    setLocation(match.location ?? "");
  }

  // Lagre resultat
  async function saveResult() {
    await updateMatchResult(editingMatch.id, homeScore, awayScore, location);

    setMatches((prev) =>
      prev.map((m) =>
        m.id === editingMatch.id
          ? { ...m, homeScore, awayScore, location, played: true }
          : m
      )
    );

    setEditingMatch(null);
  }

  return (
    <section className="admin-page">
      <h1>Kamper denne dagen</h1>

      {matchesForDay.length === 0 && (
        <p>Ingen kamper denne dagen.</p>
      )}

      {/* Kamp-liste */}
      {matchesForDay.map((m) => (
        <div
          key={m.id}
          className="admin-match-row"
          onClick={() => onSelectMatch(m)}
          style={{ cursor: "pointer" }}
        >
          {teams[m.homeTeamId]?.name || "?"} – {teams[m.awayTeamId]?.name || "?"}
        </div>
      ))}

      {/* Redigering */}
      {editingMatch && (
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
    </section>
  );
}

