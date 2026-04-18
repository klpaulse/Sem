import { useState, useEffect } from "react";

export default function CardForm({ data, setData, homeTeam, awayTeam }) {
  const [selectedTeam, setSelectedTeam] = useState(data.team || "");
  const [selectedPlayer, setSelectedPlayer] = useState(data.player || "");

  // ⭐ Når LiveControls nullstiller data → nullstill feltene her også
  useEffect(() => {
    setSelectedTeam(data.team || "");
    setSelectedPlayer(data.player || "");
  }, [data]);

  const players =
    selectedTeam === homeTeam?.id
      ? homeTeam?.players || []
      : selectedTeam === awayTeam?.id
      ? awayTeam?.players || []
      : [];

  // Oppdater parent når feltene endres
  useEffect(() => {
    setData({
      team: selectedTeam,
      player: selectedPlayer
    });
  }, [selectedTeam, selectedPlayer]);

  return (
    <div className="card-form">
      <label>Lag</label>
      <select
        value={selectedTeam}
        onChange={(e) => {
          setSelectedTeam(e.target.value);
          setSelectedPlayer("");
        }}
      >
        <option value="">Velg lag</option>
        <option value={homeTeam.id}>{homeTeam.name}</option>
        <option value={awayTeam.id}>{awayTeam.name}</option>
      </select>

      <label>Spiller</label>
      <select
        value={selectedPlayer}
        onChange={(e) => setSelectedPlayer(e.target.value)}
        disabled={!selectedTeam}
      >
        <option value="">Velg spiller</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
