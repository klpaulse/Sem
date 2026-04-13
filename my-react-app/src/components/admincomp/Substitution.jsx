import { useEffect, useState } from "react";
import { getTeam } from "../../services/TeamService";

export default function Substitution({
  selectedMatch,
  homeTeamId,
  awayTeamId,
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

  useEffect(() => {
    if (!homeTeamId || !awayTeamId) return;

    async function loadTeams() {
      const home = await getTeam(homeTeamId);
      const away = await getTeam(awayTeamId);

      setHomeTeam(home);
      setAwayTeam(away);
    }

    loadTeams();
  }, [homeTeamId, awayTeamId]);

  // ⭐ HINDRER at dropdownene forsvinner
  if (!homeTeam || !awayTeam) {
    return <div>Laster lag...</div>;
  }

  const currentPlayers =
    subTeam === homeTeamId
      ? homeTeam.players || []
      : subTeam === awayTeamId
      ? awayTeam.players || []
      : [];

  return (
    <div>
      <label>Lag</label>
      <select
        value={subTeam || ""}
        onChange={(e) => {
          setSubTeam(e.target.value);
          setSubIn("");
          setSubOut("");
        }}
      >
        <option value="">Velg lag</option>

        <option value={homeTeamId}>{homeTeam.name}</option>
        <option value={awayTeamId}>{awayTeam.name}</option>
      </select>

      <label>Spiller inn</label>
      <select
        value={subIn}
        onChange={(e) => setSubIn(e.target.value)}
        disabled={!subTeam}
      >
        <option value="">Velg spiller</option>
        {currentPlayers.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <label>Spiller ut</label>
      <select
        value={subOut}
        onChange={(e) => setSubOut(e.target.value)}
        disabled={!subTeam}
      >
        <option value="">Velg spiller</option>
        {currentPlayers.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <label>Kommentar</label>
      <input
        type="text"
        value={subComment}
        onChange={(e) => setSubComment(e.target.value)}
      />
    </div>
  );
}
