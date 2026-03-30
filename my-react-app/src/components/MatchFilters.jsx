export default function MatchFilters({ selectedRound,
  setSelectedRound,
  selectedMonth,
  setSelectedMonth,
  selectedTeam,
  setSelectedTeam,
  matches
}) {
    return(
        <section>
         {/* Runde */}
            <select
              value={selectedRound || ""}
              onChange={(e) =>
                setSelectedRound(e.target.value || null)
              }
            >
              <option value="">runde</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
                <option key={r} value={r}>
                  Runde {r}
                </option>
              ))}
            </select>
            {/* Måned */}
            <select
              value={selectedMonth ?? ""}
              onChange={(e) =>
                setSelectedMonth(
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
            >
              <option value="">måneder</option>
              {[
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "Mai",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Okt",
                "Nov",
                "Des",
              ].map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>

            {/* Lag */}
            <select
              value={selectedTeam || ""}
              onChange={(e) =>
                setSelectedTeam(e.target.value || null)
              }
            >
              <option value="">lag</option>
              {[
                ...new Set(
                  matches.flatMap((m) => [m.homeTeam, m.awayTeam])
                ),
              ].map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
            </section>

    )
}