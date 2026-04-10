import { useEffect, useState } from "react";
import Countdown from "../Countdown";
import "../../assets/style/matchPage.css";
import BeforeMatchInfo from "./BeforeMatchInfo";
import { getSeasonMatches } from "../../services/MatchService";

// 🔥 Felles dato-normalisering
function normalizeDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (d.toDate) return d.toDate(); // Firestore Timestamp
  return new Date(d); // ISO string
}

export default function BeforeMatch({ match, allMatches }) {
  if (!match) return null;

  const matchDate = normalizeDate(match.date);

  const [homeSeason, setHomeSeason] = useState([]);
  const [awaySeason, setAwaySeason] = useState([]);

  useEffect(() => {
    async function loadSeason() {
      if (!match) return;

      const home = await getSeasonMatches(match.homeTeamId, "2026");
      const away = await getSeasonMatches(match.awayTeamId, "2026");

      setHomeSeason(home);
      setAwaySeason(away);
    }

    loadSeason();
  }, [match]);

  return (
    <section className="page">
      <h1 className="live-header">Breddefotball Live</h1>

      {/* Countdown */}
      <div className="countdown">
        <Countdown date={matchDate} />
      </div>

      {/* Kampkort */}
      <div className="last-played-card">
        <div className="lp-row">
          <span className="lp-title">{match.homeTeamName}</span>
          <span className="lp-title">{match.awayTeamName}</span>
        </div>

        <p className="dato">
          {match.time ||
            matchDate.toLocaleTimeString("no-NO", {
              hour: "2-digit",
              minute: "2-digit",
            })}
        </p>
      </div>

      {/* Info-boksene (inkl. timeline) */}
      <BeforeMatchInfo
        match={match}
        allMatches={allMatches}
        homeSeason={homeSeason}
        awaySeason={awaySeason}
      />
    </section>
  );
}