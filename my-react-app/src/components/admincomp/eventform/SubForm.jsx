export default function SubForm({ data, setData, homeTeam, awayTeam }) {
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

      <label>Inn</label>
      <input
        value={data.in}
        onChange={(e) => setData({ ...data, in: e.target.value })}
      />

      <label>Ut</label>
      <input
        value={data.out}
        onChange={(e) => setData({ ...data, out: e.target.value })}
      />

      <label>Kommentar</label>
      <input
        value={data.comment}
        onChange={(e) => setData({ ...data, comment: e.target.value })}
      />
    </div>
  );
}