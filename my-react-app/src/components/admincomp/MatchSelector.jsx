import { useEffect, useState } from "react";
import { getTeam } from "../../services/TeamService";

export default function MatchSelector({ matches, selectedMatch, setSelectedMatch }) {
  const [teams, setTeams] = useState({}); // cache for lag

  // Hent lagnavn for alle kamper
  useEffect(() => {
    async function loadTeams() {
      const map = {};

      for (const m of matches) {
        if (m.homeTeamId && !map[m.homeTeamId]) {
          map[m.homeTeamId] = await getTeam(m.homeTeamId);
        }
        if (m.awayTeamId && !map[m.awayTeamId]) {
          map[m.awayTeamId] = await getTeam(m.awayTeamId);
        }
      }

      setTeams(map);
    }

    if (matches.length > 0) {
      loadTeams();
    }
  }, [matches]);

  function handleSelect(id) {
    const match = matches.find((m) => m.id === id);

    if (!match) return;

    // Send et rent match-objekt videre
    const cleanMatch = {
      id: match.id,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      division: match.division,
      date: match.date,
      time: match.time,
      arena: match.arena,
      status: match.status,
      season: match.season,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
    };

    setSelectedMatch(cleanMatch);
  }

  return (
    <section>
      <h2>Velg kamp for live-oppdatering</h2>

      <select
        value={selectedMatch?.id || ""}
        onChange={(e) => handleSelect(e.target.value)}
      >
        <option value="">Velg kamp</option>

        {matches.map((m) => (
          <option key={m.id} value={m.id}>
            {teams[m.homeTeamId]?.name || m.homeTeamId} vs{" "}
            {teams[m.awayTeamId]?.name || m.awayTeamId}
          </option>
        ))}
      </select>
    </section>
  );
}