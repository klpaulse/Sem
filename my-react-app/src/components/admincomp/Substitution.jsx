import { useEffect, useState } from "react";
import { getTeam } from "../../services/TeamService";

export default function Substitution({
  selectedMatch,
  subTeam,
  setSubTeam,
  subIn,
  setSubIn,
  subOut,
  setSubOut,
  subComment,
  setSubComment
}) {
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);

  // Hent lagnavn basert på ID
  useEffect(() => {
    if (!selectedMatch) return;

    async function loadTeams() {
      const home = await getTeam(selectedMatch.homeTeam);
      const away = await getTeam(selectedMatch.awayTeam);

      setHomeTeam(home);
      setAwayTeam(away);
    }

    loadTeams();
  }, [selectedMatch]);

  return (
    <div>
      {/* Lagvalg */}
      <select
        value={subTeam || ""}
        onChange={(e) => setSubTeam(e.target.value)}
      >
        <option value="">Velg lag</option>

        {homeTeam && (
          <option value={selectedMatch.homeTeam}>
            {homeTeam.teamName}
          </option>
        )}

        {awayTeam && (
          <option value={selectedMatch.awayTeam}>
            {awayTeam.teamName}
          </option>
        )}
      </select>

      {/* Spiller inn */}
      <input
        type="text"
        placeholder="Spiller inn"
        value={subIn}
        onChange={(e) => setSubIn(e.target.value)}
      />

      {/* Spiller ut */}
      <input
        type="text"
        placeholder="Spiller ut"
        value={subOut}
        onChange={(e) => setSubOut(e.target.value)}
      />

      {/* Kommentar */}
      <input
        type="text"
        placeholder="Kommentar (valgfritt)"
        value={subComment}
        onChange={(e) => setSubComment(e.target.value)}
      />
    </div>
  );
}
