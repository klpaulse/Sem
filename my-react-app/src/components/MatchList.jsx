import PlayedMatches from "./PlayedMatches";
import Upcoming from "./Upcoming";

export default function MatchList({ filteredMatches, matches, played, upcomingRef }){

    return(
        <section>
         {filteredMatches.map((m) => (
              <p key={m.id}>
                <strong>{m.homeTeam}</strong> {m.homeScore} - {m.awayScore}{" "}
                <strong>{m.awayTeam}</strong>
              </p>
            ))}
            <h2 ref={upcomingRef}>Kommende kamper</h2>
            <Upcoming matches={matches} />

            <h2>Spilte kamper</h2>
            <PlayedMatches matches={matches} />
            {played.map(m => (
              <p key={m.id}>
                <strong>{m.homeTeam}</strong> {m.homeScore} - {m.awayScore} <strong>{m.awayTeam}</strong>
              </p>
            ))}
            </section>

    )
}