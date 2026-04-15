import { useState, useEffect } from "react";

export default function WhistleForm({ data, setData, homeTeam, awayTeam }) {
  const [selectedTeam, setSelectedTeam] = useState(data.team || "");
  const [selectedPlayer, setSelectedPlayer] = useState(data.player || "");
  const [comment, setComment] = useState(data.comment || "");

  const players =
    selectedTeam === homeTeam?.id
      ? homeTeam?.players || []
      : selectedTeam === awayTeam?.id
      ? awayTeam?.players || []
      : [];

  useEffect(() => {
    setData({
      team: selectedTeam,
      player: selectedPlayer,
      comment
    });
  }, [selectedTeam, selectedPlayer, comment]);

  return (
    <div className="whistle-form">
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

      <label>Kommentar</label>
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
    </div>
  );
}