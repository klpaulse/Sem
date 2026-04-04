import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PlayedMatches from "../PlayedMatches";
import { getTeam } from "../../services/TeamService";
import Upcoming from "../Upcoming"

export default function MatchList({ filteredMatches, matches, played, upcomingRef }) {
  const [teamData, setTeamData] = useState({}); // Cache for team-objekter

  // Hent ALLE lag som trengs for listen
  useEffect(() => {
    async function loadTeams() {
      const cache = {};

      for (const match of filteredMatches) {
        if (!cache[match.homeTeam]) {
          cache[match.homeTeam] = await getTeam(match.homeTeam);
        }
        if (!cache[match.awayTeam]) {
          cache[match.awayTeam] = await getTeam(match.awayTeam);
        }
      }

      setTeamData(cache);
    }

    if (filteredMatches.length > 0) {
      loadTeams();
    }
  }, [filteredMatches]);

  if (!filteredMatches || filteredMatches.length === 0) {
    return <p>Ingen kamper funnet.</p>;
  }

  return (
    <section>
      {/* 🔥 LISTE OVER FILTRERTE KAMPER */}
      {filteredMatches.map((m) => {
        const home = teamData[m.homeTeam];
        const away = teamData[m.awayTeam];

        if (!home || !away) {
          return <p key={m.id}>Laster lag...</p>;
        }

        return (
          <p key={m.id}>
            <strong>{home.teamName}</strong> {m.homeScore} - {m.awayScore}{" "}
            <strong>{away.teamName}</strong>
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
        const home = teamData[m.homeTeam];
        const away = teamData[m.awayTeam];

        if (!home || !away) {
          return <p key={m.id}>Laster lag...</p>;
        }

        return (
          <p key={m.id}>
            <strong>{home.teamName}</strong> {m.homeScore} - {m.awayScore}{" "}
            <strong>{away.teamName}</strong>
          </p>
        );
      })}
    </section>
  );
}