import { useEffect, useState } from "react";
import { getTeam } from "../services/TeamService";


export default function Upcoming({ matches }) {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [teamData, setTeamData] = useState({}); // cache for team-objekter

  useEffect(() => {
    if (!matches || matches.length === 0) return;

    const now = new Date();

    // Filtrer kommende kamper
    const upcoming = matches
      .filter((m) => {
        if (!m.date) return false;

        const baseDate = m.date.toDate ? m.date.toDate() : new Date(m.date);
        if (isNaN(baseDate)) return false;

        const datePart = baseDate.toISOString().split("T")[0];
        const matchDateTime = new Date(`${datePart}T${m.time}`);

        return matchDateTime >= now;
      })
      .sort((a, b) => {
        const aBase = a.date.toDate ? a.date.toDate() : new Date(a.date);
        const bBase = b.date.toDate ? b.date.toDate() : new Date(b.date);

        const aDate = new Date(`${aBase.toISOString().split("T")[0]}T${a.time}`);
        const bDate = new Date(`${bBase.toISOString().split("T")[0]}T${b.time}`);

        return aDate - bDate;
      });

    setUpcomingMatches(upcoming);
  }, [matches]);

  // Hent team-objekter for ALLE kommende kamper
  useEffect(() => {
    async function loadTeams() {
      const cache = {};

      for (const match of upcomingMatches) {
        if (!cache[match.homeTeam]) {
          cache[match.homeTeam] = await getTeam(match.homeTeam);
        }
        if (!cache[match.awayTeam]) {
          cache[match.awayTeam] = await getTeam(match.awayTeam);
        }
      }

      setTeamData(cache);
    }

    if (upcomingMatches.length > 0) {
      loadTeams();
    }
  }, [upcomingMatches]);

  if (upcomingMatches.length === 0) {
    return (
      <section>
        <h2>Kommende kamper</h2>
        <p>Ingen kommende kamper</p>
      </section>
    );
  }

  // Hopper over første kamp (den vises i NextMatch)
  const rest = upcomingMatches.slice(1);

  return (
    <section>
      <h2>Kommende kamper</h2>

      {rest.length === 0 && <p>Ingen flere kommende kamper</p>}

      {rest.map((m, index) => {
        const home = teamData[m.homeTeam];
        const away = teamData[m.awayTeam];

        if (!home || !away) {
          return <p key={index}>Laster lag...</p>;
        }

        const baseDate = m.date.toDate ? m.date.toDate() : new Date(m.date);
        const datePart = baseDate.toISOString().split("T")[0];
        const kampDato = new Date(`${datePart}T${m.time}`);

        return (
          <div key={index} style={{ marginBottom: "1rem" }}>
            <p>
              {m.day} {kampDato.toLocaleDateString("no-NO")} – {m.time}
            </p>
            <p>
              {home.teamName} vs {away.teamName}
            </p>
          </div>
        );
      })}
    </section>
  );
}
