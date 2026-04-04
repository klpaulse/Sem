import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

export default function DivisionList({
  matchesByDivision,
  navigate,
  selectedDate
}) {
  const divisions = Object.keys(matchesByDivision);

  const [openDivisions, setOpenDivisions] = useState({});

  useEffect(() => {
    const initial = {};
    divisions.forEach((d) => (initial[d] = true));
    setOpenDivisions(initial);
  }, [divisions]);

  const toggleDivision = (division) => {
    setOpenDivisions((prev) => ({
      ...prev,
      [division]: !prev[division],
    }));
  };

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  return (
    <section className="division-list">
      <h2>Divisjoner</h2>

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

            {/* HEADER */}
            <div className="division-header center-layout">
  <h3>{division}</h3>
  <div
  style={{
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(255,0,0,0.3)",
    zIndex: 999999,
  }}
  onClick={() => console.log("🟥 OVERLAY KLIKKET")}
>
  TEST
</div>


 <button
  className={`division-arrow-btn ${isOpen ? "open" : ""}`}
  onClick={() => toggleDivision(division)}
>
  ▼
</button>
</div>

            {/* MATCHLISTE */}
            <div className={`division-matches-wrapper ${isOpen ? "open" : ""}`}>
              <div className="division-matches">
                {matches.map((match) => {
                  const played =
                    match.homeScore !== null && match.awayScore !== null;

                  const isLive = match.liveMinute !== null;
                  const isPaused = match.livePaused === true;

                  return (
                    <div
                      key={match.id}
                      className="division-match"
                      onClick={() => navigate(`/match/${match.id}`)}
                    >
                      <div className="match-row">

                        <div className="match-left">
                          <div className="row">
                            <span className="left-col">
                              {played ? match.homeScore : "—"}
                            </span>
                            <span className="team">{match.homeTeamName}</span>
                          </div>

                          <div className="row">
                            <span className="left-col">
                              {played ? match.awayScore : "—"}
                            </span>
                            <span className="team">{match.awayTeamName}</span>
                          </div>
                        </div>

                        <div className="match-right">
                          {isPaused ? (
                            <span className="match-status pause">Pause</span>
                          ) : isLive ? (
                            <span className="match-status live">
                              {match.liveMinute}'
                            </span>
                          ) : (
                            <span className="match-time">
                              {match.date?.toDate().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>

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
