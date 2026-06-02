import { useMemo, useState } from "react";

export default function UpcomingMatches({ matches, teamNames, navigate }) {
  const now = new Date();
  const [selectedDivision, setSelectedDivision] = useState(null);

  const byDivision = useMemo(() => {
    const upcoming = matches.filter(m => {
      if (!m.date) return false;
      const d = m.date?.toDate ? m.date.toDate() : new Date(m.date);
      const status = (m.status || "").toLowerCase();
      if (status === "finished" || status === "live" || status === "pause") return false;
      if (status === "postponed") return false;
      return d >= now;
    });

    const grouped = {};
    upcoming.forEach(m => {
      const div = m.division?.trim() || "Ukjent divisjon";
      if (!grouped[div]) grouped[div] = [];
      grouped[div].push(m);
    });

    Object.keys(grouped).forEach(div => {
      grouped[div].sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return da - db;
      });
    });

    return Object.entries(grouped).sort(([a], [b]) =>
      a.localeCompare(b, "no", { numeric: true })
    );
  }, [matches]);

  const divisions = byDivision.map(([div]) => div);
  const activeDivision = selectedDivision ?? divisions[0];
  const activeMatches = byDivision.find(([div]) => div === activeDivision)?.[1] || [];

  if (byDivision.length === 0) {
    return <p className="upcoming-empty">Ingen kommende kamper registrert.</p>;
  }

  return (
    <div className="upcoming-section-inner">
      <div className="division-tabs">
        {divisions.map(div => (
          <button
            key={div}
            className={`division-tab${activeDivision === div ? " active" : ""}`}
            onClick={() => setSelectedDivision(div)}
          >
            {div}
          </button>
        ))}
      </div>

      <ul className="upcoming-matches">
        {activeMatches.map(m => {
          const d = m.date?.toDate ? m.date.toDate() : new Date(m.date);
          const dateStr = d.toLocaleDateString("nb-NO", { weekday: "short", day: "numeric", month: "short" });
          const homeName = teamNames[m.homeTeamId] || "…";
          const awayName = teamNames[m.awayTeamId] || "…";
          return (
            <li
              key={m.id}
              className="upcoming-match"
              onClick={() => navigate(`/match/${m.slug || m.id}`)}
            >
              <span className="upcoming-match-date">{dateStr}</span>
              <span className="upcoming-match-teams">{homeName} – {awayName}</span>
              {m.time && <span className="upcoming-match-time">kl {m.time}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
