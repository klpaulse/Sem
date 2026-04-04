export default function MatchFilters({
  selectedRound,
  setSelectedRound,
  selectedMonth,
  setSelectedMonth,
  selectedTeam,
  setSelectedTeam,
  matches
}) {
  // Unike runder
  const uniqueRounds = [...new Set(matches.map((m) => m.round).filter(Boolean))];

  // Unike lag
  const uniqueTeams = [
    ...new Set(
      matches.flatMap((m) => [m.homeTeam, m.awayTeam]).filter(Boolean)
    ),
  ];

  return (
    <div className="match-filters">
      {/* Runde */}
      <select
        value={selectedRound || ""}
        onChange={(e) => setSelectedRound(e.target.value || null)}
      >
        <option value="">Alle runder</option>
        {uniqueRounds.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      {/* Måned */}
      <select
        value={selectedMonth ?? ""}
        onChange={(e) =>
          setSelectedMonth(
            e.target.value !== "" ? Number(e.target.value) : null
          )
        }
      >
        <option value="">Alle måneder</option>
        {[...Array(12).keys()].map((m) => (
          <option key={m} value={m}>
            {m + 1}
          </option>
        ))}
      </select>

      {/* Lag */}
      <select
        value={selectedTeam || ""}
        onChange={(e) => setSelectedTeam(e.target.value || null)}
      >
        <option value="">Alle lag</option>
        {uniqueTeams.map((team) => (
          <option key={team} value={team}>
            {team}
          </option>
        ))}
      </select>
    </div>
  );
}