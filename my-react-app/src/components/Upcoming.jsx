import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Upcoming({ matches }) {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!matches || matches.length === 0) return;

    const now = new Date();

    // 🔥 Filtrer kommende kamper basert på FULL datetime i `date`
    const upcoming = matches
      .filter((m) => {
        if (!m.date) return false;
        const matchDate = m.date.toDate();
        return matchDate >= now;
      })
      .sort((a, b) => a.date.toDate() - b.date.toDate());

    setUpcomingMatches(upcoming);
  }, [matches]);

  if (upcomingMatches.length === 0) {
    return (
      <section>
        <h2>Kommende kamper</h2>
        <p>Ingen kommende kamper</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Kommende kamper</h2>

      {upcomingMatches.map((m) => {
        const matchDate = m.date.toDate();

        return (
          <div
            key={m.id}
            className="match-clickable"
            onClick={() => navigate(`/match/${m.id}`)}
          >
            <p>
              {matchDate.toLocaleDateString("no-NO")} – {m.time}
            </p>
            <p>
              {m.homeTeamName} vs {m.awayTeamName}
            </p>
          </div>
        );
      })}
    </section>
  );
}
