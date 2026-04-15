import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlayedMatches from "../PlayedMatches";
import Upcoming from "../Upcoming";
import { getTeam } from "../../services/TeamService";

export default function MatchList({ filteredMatches, matches, played, upcomingRef }) {
  const navigate = useNavigate();

  const [teamNames, setTeamNames] = useState({});

  // ⭐ Hent lagnavn basert på ID
  useEffect(() => {
    async function loadNames() {
      const map = {};

      const all = [...filteredMatches, ...matches, ...played];

      for (const m of all) {
        if (m?.homeTeamId && !map[m.homeTeamId]) {
          map[m.homeTeamId] = await getTeam(m.homeTeamId);
        }
        if (m?.awayTeamId && !map[m.awayTeamId]) {
          map[m.awayTeamId] = await getTeam(m.awayTeamId);
        }
      }

      setTeamNames(map);
    }

    if (matches.length > 0) loadNames();
  }, [filteredMatches, matches, played]);

  if (!filteredMatches || filteredMatches.length === 0) {
    return <p>Ingen kamper funnet.</p>;
  }

  return (
    <section>
      {/* 🔥 LISTE OVER FILTRERTE KAMPER */}
      {filteredMatches.map((m) => {
        const dateObj = m.date?.toDate ? m.date.toDate() : new Date(m.date);

        const homeName = teamNames[m.homeTeamId]?.name || "Ukjent lag";
        const awayName = teamNames[m.awayTeamId]?.name || "Ukjent lag";

        return (
          <p
            key={m.id}
            onClick={() => navigate(`/match/${m.id}`)}
            className="match-clickable"
          >
            <strong>{homeName}</strong> {m.homeScore} - {m.awayScore}{" "}
            <strong>{awayName}</strong>
            {" — "}
            {dateObj.toLocaleDateString("no-NO")}
          </p>
        );
      })}

      {/* 🔥 KOMMENDE KAMPER */}
      <h2 ref={upcomingRef}>Kommende kamper</h2>
      <Upcoming matches={matches} />

      {/* 🔥 SPILTE KAMPER */}
      <h2>Spilte kamper</h2>
      <PlayedMatches matches={matches} />

      {/* 🔥 SPILTE (egen liste) */}
      {played.map((m) => {
        const dateObj = m.date?.toDate ? m.date.toDate() : new Date(m.date);

        const homeName = teamNames[m.homeTeamId]?.name || "Ukjent lag";
        const awayName = teamNames[m.awayTeamId]?.name || "Ukjent lag";

        return (
          <p
            key={m.id}
            onClick={() => navigate(`/match/${m.id}`)}
            className="match-clickable"
          >
            <strong>{homeName}</strong> {m.homeScore} - {m.awayScore}{" "}
            <strong>{awayName}</strong>
            {" — "}
            {dateObj.toLocaleDateString("no-NO")}
          </p>
        );
      })}
    </section>
  );
}