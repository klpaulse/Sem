export default function WhistleForm({ data, setData, homeTeam, awayTeam }) {
  const homeKey = homeTeam?.id || homeTeam?.name;
  const awayKey = awayTeam?.id || awayTeam?.name;

  return (
    <div>
      <label>Lag</label>
      <select
        value={data.team}
        onChange={(e) => setData({ ...data, team: e.target.value })}
      >
        <option value="">Velg lag</option>
        <option value={homeKey}>{homeTeam?.name}</option>
        <option value={awayKey}>{awayTeam?.name}</option>
      </select>

      <label>Spiller</label>
      <input
        value={data.player}
        onChange={(e) => setData({ ...data, player: e.target.value })}
      />

      <label>Kommentar</label>
      <input
        value={data.comment}
        onChange={(e) => setData({ ...data, comment: e.target.value })}
      />
    </div>
  );
}