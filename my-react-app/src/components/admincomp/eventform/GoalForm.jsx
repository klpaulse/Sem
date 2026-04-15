import { useState } from "react";

export default function GoalForm({ data, setData, homeTeam, awayTeam }) {
  const [selectedTeam, setSelectedTeam] = useState(data.team || homeTeam.id);

  // Hent spillere fra valgt lag
  const players =
    selectedTeam === homeTeam.id
      ? homeTeam.players || []
      : awayTeam.players || [];

  return (
    <div className="goal-form">

      {/* ⭐ Velg lag */}
      <label>Lag</label>
      <select
        value={selectedTeam}
        onChange={(e) => {
          const teamId = e.target.value;
          setSelectedTeam(teamId);
          setData({ ...data, team: teamId, player: "", assist: "" });
        }}
      >
        <option value={homeTeam.id}>{homeTeam.name}</option>
        <option value={awayTeam.id}>{awayTeam.name}</option>
      </select>

      {/* ⭐ Målscorer */}
      <label>Målscorer</label>
      <select
        value={data.player || ""}
        onChange={(e) => setData({ ...data, player: e.target.value })}
      >
        <option value="">Velg spiller</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* ⭐ Assist (valgfritt) */}
      <label>Assist (valgfritt)</label>
      <select
        value={data.assist || ""}
        onChange={(e) => setData({ ...data, assist: e.target.value })}
      >
        <option value="">Ingen assist</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}