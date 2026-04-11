import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function normalizeDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (d.toDate) return d.toDate();
  return new Date(d);
}

export default function Upcoming({ matches }) {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!matches || matches.length === 0) return;

    const now = new Date();

    const upcoming = matches
      .map((m) => ({ ...m, dateObj: normalizeDate(m.date) }))
      .filter((m) => m.dateObj && m.dateObj >= now)
      .sort((a, b) => a.dateObj - b.dateObj);

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
        const matchDate = m.dateObj;

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
