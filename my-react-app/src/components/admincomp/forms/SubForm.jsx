import { useState, useEffect } from "react";

export default function SubForm({ data, setData, homeTeam, awayTeam }) {
  const [selectedTeam, setSelectedTeam] = useState(data.team || "");
  const [playerIn, setPlayerIn] = useState(data.in || "");
  const [playerOut, setPlayerOut] = useState(data.out || "");
  const [comment, setComment] = useState(data.comment || "");

  // ⭐ Nullstill når parent-data endres
  useEffect(() => {
    setSelectedTeam(data.team || "");
    setPlayerIn(data.in || "");
    setPlayerOut(data.out || "");
    setComment(data.comment || "");
  }, [data]);

  const players =
    selectedTeam === homeTeam?.id
      ? homeTeam?.players || []
      : selectedTeam === awayTeam?.id
      ? awayTeam?.players || []
      : [];

  // Oppdater EventForm når noe endres
  useEffect(() => {
    setData({
      team: selectedTeam,
      in: playerIn,
      out: playerOut,
      comment
    });
  }, [selectedTeam, playerIn, playerOut, comment]);

  return (
    <div className="sub-form">
      <label>Lag</label>
      <select
        value={selectedTeam}
        onChange={(e) => {
          setSelectedTeam(e.target.value);
          setPlayerIn("");
          setPlayerOut("");
        }}
      >
        <option value="">Velg lag</option>
        <option value={homeTeam.id}>{homeTeam.name}</option>
        <option value={awayTeam.id}>{awayTeam.name}</option>
      </select>

      <label>Inn</label>
      <select
        value={playerIn}
        onChange={(e) => setPlayerIn(e.target.value)}
        disabled={!selectedTeam}
      >
        <option value="">Velg spiller inn</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <label>Ut</label>
      <select
        value={playerOut}
        onChange={(e) => setPlayerOut(e.target.value)}
        disabled={!selectedTeam}
      >
        <option value="">Velg spiller ut</option>
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
