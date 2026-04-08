import { useNavigate } from "react-router-dom";
import PlayedMatches from "../PlayedMatches";
import Upcoming from "../Upcoming";

export default function MatchList({ filteredMatches, matches, played, upcomingRef }) {
  const navigate = useNavigate();

  if (!filteredMatches || filteredMatches.length === 0) {
    return <p>Ingen kamper funnet.</p>;
  }

  return (
    <section>
      {/* 🔥 LISTE OVER FILTRERTE KAMPER */}
      {filteredMatches.map((m) => {
        const matchDate = m.date.toDate(); // 🔥 full datetime

        return (
          <p
            key={m.id}
            onClick={() => navigate(`/match/${m.id}`)}
            className="match-clickable"
          >
            <strong>{m.homeTeamName}</strong> {m.homeScore} - {m.awayScore}{" "}
            <strong>{m.awayTeamName}</strong>
            {" — "}
            {matchDate.toLocaleDateString("no-NO")}
          </p>
        );
      })}

      {/* 🔥 KOMMENDE KAMPER */}
      <h2 ref={upcomingRef}>Kommende kamper</h2>
      <Upcoming matches={matches} />

      {/* 🔥 SPILTE KAMPER */}
      <h2>Spilte kamper</h2>
      <PlayedMatches matches={matches} />

      {played.map((m) => {
        const matchDate = m.date.toDate(); // 🔥 full datetime

        return (
          <p
            key={m.id}
            onClick={() => navigate(`/match/${m.id}`)}
            className="match-clickable"
          >
            <strong>{m.homeTeamName}</strong> {m.homeScore} - {m.awayScore}{" "}
            <strong>{m.awayTeamName}</strong>
            {" — "}
            {matchDate.toLocaleDateString("no-NO")}
          </p>
        );
      })}
    </section>
  );
}