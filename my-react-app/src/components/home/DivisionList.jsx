import { useState, useEffect, useMemo } from "react";
import { getTeam } from "../../services/TeamService";
import MatchCard from "../match/MatchCard";

export default function DivisionList({
  matchesByDivision,
  navigate,
  selectedDate
}) {
  const divisionOrder = [
    "4.div",
    "5.div",
    "6.div",
    "7.div avd 1",
    "7.div avd 2"
  ];

  const divisions = useMemo(() => {
    return Object.keys(matchesByDivision).sort(
      (a, b) => divisionOrder.indexOf(a) - divisionOrder.indexOf(b)
    );
  }, [matchesByDivision]);

  const [openDivisions, setOpenDivisions] = useState({});
  const [teamNames, setTeamNames] = useState({});

  useEffect(() => {
    async function loadNames() {
      const map = {};

      for (const division of divisions) {
        const matches = matchesByDivision[division] || [];

        for (const m of matches) {
          if (m.homeTeamId && !map[m.homeTeamId]) {
            map[m.homeTeamId] = await getTeam(m.homeTeamId);
          }
          if (m.awayTeamId && !map[m.awayTeamId]) {
            map[m.awayTeamId] = await getTeam(m.awayTeamId);
          }
        }
      }

      setTeamNames(map);
    }

    if (divisions.length > 0) loadNames();
  }, [divisions]);

  useEffect(() => {
    setOpenDivisions((prev) => {
      const updated = { ...prev };
      let changed = false;

      divisions.forEach((d) => {
        if (!(d in updated)) {
          updated[d] = true;
          changed = true;
        }
      });

      return changed ? updated : prev;
    });
  }, [divisions]);

  const toggleDivision = (division) => {
    setOpenDivisions((prev) => ({
      ...prev,
      [division]: !prev[division],
    }));
  };

  const isSameDay = (d1, d2) =>
    d1 instanceof Date &&
    d2 instanceof Date &&
    !isNaN(d1) &&
    !isNaN(d2) &&
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  return (
    <section className="division-list">

      {divisions.map((division) => {
        const matches = (matchesByDivision[division] || []).filter((match) => {
          if (!selectedDate) return true;

          const matchDate = match.date?.toDate
            ? match.date.toDate()
            : new Date(match.date);

          return isSameDay(matchDate, selectedDate);
        });

        if (matches.length === 0) return null;

        const isOpen = openDivisions[division];

        return (
          <section key={division} className="division-block">
            <h3 className="division-heading">
              <button
                className="division-header"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDivision(division);
                }}
                aria-expanded={isOpen}
              >
                <span>{division}</span>
                <span className={`dropdown-arrow ${isOpen ? "open" : ""}`}>
                  ⌄
                </span>
              </button>
            </h3>

            <div className={`division-matches-wrapper ${isOpen ? "open" : ""}`}>
              <ul className="division-matches">
                {matches.map((match) => {
                  const homeName =
                    teamNames[match.homeTeamId]?.name || "Ukjent lag";
                  const awayName =
                    teamNames[match.awayTeamId]?.name || "Ukjent lag";

                  return (
                    <li key={match.id}>
                      <MatchCard
                        match={match}
                        homeName={homeName}
                        awayName={awayName}
                        onClick={() => navigate(`/match/${match.slug || match.id}`)}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      })}
    </section>
  );
}
