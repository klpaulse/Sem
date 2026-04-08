export default function BeforeMatchInfo({match, allMatches}){
if (!match) return null

const home = match.homeTeam
const away = match.awayTeam

const headToHead = allMatches.filter(m => 
(m.homeTeam === home && m.awayTeam === away) ||
(m.homeTeam === away && m.awayTeam === home)
)
.filter(m => m.homeScore !== null)
.sort((a, b) => b.date.toDate() - a.date.toDate())
.slice(0, 3)

const lastHome = allMatches
.filter(m => 
     (m.homeTeam === home || m.awayTeam === home) &&
      m.homeScore !== null
    )
    .sort((a, b) => b.date.toDate() - a.date.toDate())
    .slice(0, 3);

     const lastAway = allMatches
    .filter(m =>
      (m.homeTeam === away || m.awayTeam === away) &&
      m.homeScore !== null
    )
    .sort((a, b) => b.date.toDate() - a.date.toDate())
    .slice(0, 3);

    return ( 
        <section>
            <h2>Før kampen</h2>
            <div className="info-block">
                <h3>{match.homeTeamName} - siste kamper</h3>
                {lastHome.map(m => (
                    <p key={m.id}> 
                    {m.homeTeamName} {m.homeScore}-{m.awayScore} {m.awayTeamName}
                 </p>
                ))}
            </div>

            <div className="info-block">
        <h3>{match.awayTeamName} – siste kamper</h3>
        {lastAway.map(m => (
          <p key={m.id}>
            {m.homeTeamName} {m.homeScore}–{m.awayScore} {m.awayTeamName}
          </p>
        ))}
      </div>

            <div className="info-block">
                <h3>Siste møter</h3>
                {headToHead.length === 0 && <p>Ingen tidligere kamper</p>}
                {headToHead.map(m => (
                    <p key={m.id}>
                        {m.homeTeamName} {m.homeScore}-{m.awayScore} {m.awayTeamName}
                    </p>
                ))}
            </div>

            <div className="info-block">
                <h3>Kampinfo</h3>
                <p>{match.arena}</p>
                <p>{match.date.toDate().toLocaleDateString("no-NO")}</p>
                <p>Runde {match.round}</p>
            </div>

        </section>
    )



}