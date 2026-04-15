export default function SimpleEventForm({ type, text, setText, homeTeam, awayTeam }) {
  const homeKey = homeTeam?.id || homeTeam?.name;
  const awayKey = awayTeam?.id || awayTeam?.name;

  return (
    <div>
      <label>Kommentar</label>
      <input value={text} onChange={(e) => setText(e.target.value)} />
    </div>
  );
}