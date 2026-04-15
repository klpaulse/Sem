import { useState, useEffect } from "react";
import { getTeam } from "../../services/TeamService";

export default function DivisionList({
  matchesByDivision,
  navigate,
  selectedDate
}) {
  const divisions = Object.keys(matchesByDivision);
  const [openDivisions, setOpenDivisions] = useState({});
  const [teamNames, setTeamNames] = useState({});

  // ⭐ Hent lagnavn basert på ID
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
  }, [divisions, matchesByDivision]);

  // Åpne nye divisjoner uten å trigge infinite loop
  useEffect(() => {
    setOpenDivisions((prev) => {
      const updated = { ...prev };

      divisions.forEach((d) => {
        if (!(d in updated)) {
          updated[d] = true;
        }
      });

      return updated;
    });
  }, [divisions.length]);

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

  const isPastMatch = (matchDate) => {
    if (!(matchDate instanceof Date) || isNaN(matchDate)) return false;
    const now = new Date();
    return matchDate < now && matchDate.toDateString() !== now.toDateString();
  };

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
          <div key={division} className="division-block">
            <div
              className="division-header"
              onClick={(e) => {
                e.stopPropagation();
                toggleDivision(division);
              }}
            >
              <h3>{division}</h3>
              <span className={`dropdown-arrow ${isOpen ? "open" : ""}`}>
                ⌄
              </span>
            </div>

            <div className={`division-matches-wrapper ${isOpen ? "open" : ""}`}>
              <div className="division-matches">
                {matches.map((match) => {
                  const matchDate = match.date?.toDate
                    ? match.date.toDate()
                    : new Date(match.date);

                  const played =
                    match.homeScore !== null && match.awayScore !== null;

                  const isLive = match.liveStarted === true;
                  const isPaused = match.livePaused === true;

                  const endedManually = match.matchEnded === true;
                  const endedAutomatically = isPastMatch(matchDate);

                  const homeWon = played && match.homeScore > match.awayScore;
                  const awayWon = played && match.awayScore > match.homeScore;

                  const homeName =
                    teamNames[match.homeTeamId]?.name || "Ukjent lag";
                  const awayName =
                    teamNames[match.awayTeamId]?.name || "Ukjent lag";

                  return (
                    <div
                      key={match.id}
                      className="match-card"
                      onClick={() => navigate(`/match/${match.id}`)}
                    >
                      <div className="match-card-teams">
                        <div className="row">
                          <span
                            className={`left-col ${
                              homeWon ? "winner" : awayWon ? "loser" : ""
                            }`}
                          >
                            {played ? match.homeScore : "-"}
                          </span>
                          <span
                            className={`team ${
                              homeWon ? "winner" : awayWon ? "loser" : ""
                            }`}
                          >
                            {homeName}
                          </span>
                        </div>

                        <div className="row">
                          <span
                            className={`left-col ${
                              awayWon ? "winner" : homeWon ? "loser" : ""
                            }`}
                          >
                            {played ? match.awayScore : "-"}
                          </span>
                          <span
                            className={`team ${
                              awayWon ? "winner" : homeWon ? "loser" : ""
                            }`}
                          >
                            {awayName}
                          </span>
                        </div>
                      </div>

                      <div className="match-right">
                        {endedManually || endedAutomatically ? (
                          <span className="match-status-ended">Slutt</span>
                        ) : isPaused ? (
                          <span className="match-status-pause">Pause</span>
                        ) : isLive ? (
                          <span className="match-minute-live">
                            {match.liveMinute}'
                          </span>
                        ) : (
                          <span className="match-time-box">
                            {matchDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
