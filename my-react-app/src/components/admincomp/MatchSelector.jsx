export default function MatchSelector ({matches, selectedMatch, setSelectedMatch}){
return (
<section>
    <h2>Velg kamp for live-oppdatering</h2>
    <select
    value={selectedMatch?.id || ""}
    onChange={(e) =>
    setSelectedMatch(matches.find((m => m.id === e.target.value)))
    }>

    <option value="">Velg kamp</option>
    {matches.map((m) => (
    <option key={m.id} value={m.id}>
    {m.homeTeam} vs {m.awayTeam}
    </option>
    ))}
    </select>
</section>
)
}